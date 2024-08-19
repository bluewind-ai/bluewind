provider "aws" {
  region  = "us-west-2"  # or your preferred region
  profile = "ci-cd-admin-2"
}

variable "app_name" {}
variable "aws_access_key_id" {}
variable "aws_secret_access_key" {}

# Create a VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.aws_secret_access_key}-ecs-vpc"
  }
}

# Create two subnets
resource "aws_subnet" "subnet_1" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-west-2a"  # Replace with an AZ in your region

  tags = {
    Name = "${var.app_name}-ecs-subnet-1"
  }
}

resource "aws_subnet" "subnet_2" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  availability_zone = "us-west-2b"  # Replace with a different AZ in your region

  tags = {
    Name = "${var.app_name}-ecs-subnet-2"
  }
}

# Create an Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-ecs-igw"
  }
}

# Create a route table
resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.app_name}-ecs-route-table"
  }
}

# Associate the route table with the subnets
resource "aws_route_table_association" "subnet_1" {
  subnet_id      = aws_subnet.subnet_1.id
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "subnet_2" {
  subnet_id      = aws_subnet.subnet_2.id
  route_table_id = aws_route_table.main.id
}

resource "aws_ecs_cluster" "my_cluster" {
  name = "${var.app_name}-my-cluster"
}

resource "aws_ecs_task_definition" "my_task" {
  family                   = "my-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]
  
  container_definitions = jsonencode([
    {
      name  = "my-container"
      image = "nginx:latest"
      memory = 512
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "my_service" {
  name            = "my-service"
  cluster         = aws_ecs_cluster.my_cluster.id
  desired_count = 1
  deployment_controller {
    type = "EXTERNAL"
  }

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.main.name
    weight            = 100
  }

  # Remove the task_definition attribute
}

output "ecs_key_pair_name" {
  description = "Name of the key pair used for ECS instances"
  value       = aws_key_pair.ecs_key_pair.key_name
}
data "aws_ssm_parameter" "ecs_optimized_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
}

resource "aws_launch_template" "ecs_lt" {
  name_prefix   = "ecs-launch-template"
  image_id      = data.aws_ssm_parameter.ecs_optimized_ami.value
  instance_type = "t3.micro"
  key_name      = aws_key_pair.ecs_key_pair.key_name

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ecs_sg.id]
  }

  user_data = base64encode(<<-EOF
#!/bin/bash
echo ECS_CLUSTER=${aws_ecs_cluster.my_cluster.name} >> /etc/ecs/ecs.config
EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.app_name}-ecs-instance"
      AmazonECSManaged = ""
    }
  }
}


resource "aws_key_pair" "ecs_key_pair" {
  key_name   = "ecs-key-pair"
  public_key = file("~/.ssh/id_rsa.pub")
}

resource "aws_security_group" "ecs_sg" {
  name        = "ecs-security-group"
  description = "Security group for ECS instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

   ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["18.237.140.160/29"]  # EC2 Instance Connect IP range for us-west-2
  }
  
   ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["12.1.37.210/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_autoscaling_group" "ecs_asg" {
  vpc_zone_identifier = [aws_subnet.subnet_1.id, aws_subnet.subnet_2.id]
  desired_capacity    = 1
  max_size            = 4
  min_size            = 1

  launch_template {
    id      = aws_launch_template.ecs_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = ""
    propagate_at_launch = true
  }
}


resource "aws_ecs_task_definition" "test_task" {
  family                   = "test-task"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  
  container_definitions = jsonencode([
    {
      name  = "test-container"
      image = "nginx:latest"
      memory = 512
      portMappings = [
        {
          containerPort = 80
          hostPort      = 0  # Dynamic port mapping
        }
      ]
    }
  ])
}

resource "null_resource" "test_deployment" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "Starting test deployment at $(date)"
      
      # Create a new task set
      TASK_SET_ID=$(aws ecs create-task-set \
        --cluster ${aws_ecs_cluster.my_cluster.name} \
        --service ${aws_ecs_service.my_service.name} \
        --task-definition ${aws_ecs_task_definition.test_task.arn} \
        --external-id $(date +%s) \
        --launch-type EC2 \
        --scale value=100,unit=PERCENT \
        --query 'taskSet.id' \
        --output text)
      
      echo "Created task set: $TASK_SET_ID"
      
      # Update the service to use the new task set
      aws ecs update-service-primary-task-set \
        --cluster ${aws_ecs_cluster.my_cluster.name} \
        --service ${aws_ecs_service.my_service.name} \
        --primary-task-set $TASK_SET_ID
      
      echo "Updated service primary task set"
      
      # Wait for the service to become stable
      aws ecs wait services-stable \
        --cluster ${aws_ecs_cluster.my_cluster.name} \
        --services ${aws_ecs_service.my_service.name}
      
      echo "Service is stable"
      
      # Fetch the service status
      aws ecs describe-services \
        --cluster ${aws_ecs_cluster.my_cluster.name} \
        --services ${aws_ecs_service.my_service.name} \
        --query 'services[0].{status:status,runningCount:runningCount,desiredCount:desiredCount,events:events[0].message}' \
        --output json > deployment_status.json
      
      cat deployment_status.json
    EOT
    environment = {
      AWS_ACCESS_KEY_ID     = var.aws_access_key_id
      AWS_SECRET_ACCESS_KEY = var.aws_secret_access_key
    }
  }
}

data "local_file" "deployment_status" {
  filename = "${path.module}/deployment_status.json"
  depends_on = [null_resource.test_deployment]
}

output "test_deployment_result" {
  description = "Status of the ECS service after test deployment"
  value = jsondecode(data.local_file.deployment_status.content)
}


resource "aws_iam_role" "ecs_instance_role" {
  name = "${var.app_name}-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_instance_role_policy" {
  role       = aws_iam_role.ecs_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs_instance_profile" {
  name = "${var.app_name}-ecs-instance-profile"
  role = aws_iam_role.ecs_instance_role.name
}


resource "aws_ecs_capacity_provider" "main" {
  name = "${var.app_name}-main-capacity-provider"

  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.ecs_asg.arn
    
    managed_scaling {
      maximum_scaling_step_size = 1000
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 100
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.my_cluster.name

  capacity_providers = [aws_ecs_capacity_provider.main.name]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = aws_ecs_capacity_provider.main.name
  }
}

resource "aws_iam_role_policy" "ec2_instance_connect" {
  name = "${var.app_name}-ec2-instance-connect"
  role = aws_iam_role.ecs_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2-instance-connect:SendSSHPublicKey"
        ]
        Resource = "*"
      }
    ]
  })
}