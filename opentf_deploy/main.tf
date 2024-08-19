provider "aws" {
  region  = "us-west-2"  # or your preferred region
  profile = "ci-cd-admin-2"
}

variable "aws_access_key_id" {}
variable "aws_secret_access_key" {}

# Create a VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "ecs-vpc"
  }
}

# Create two subnets
resource "aws_subnet" "subnet_1" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-west-2a"  # Replace with an AZ in your region

  tags = {
    Name = "ecs-subnet-1"
  }
}

resource "aws_subnet" "subnet_2" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  availability_zone = "us-west-2b"  # Replace with a different AZ in your region

  tags = {
    Name = "ecs-subnet-2"
  }
}

# Create an Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "ecs-igw"
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
    Name = "ecs-route-table"
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
  name = "my-cluster"
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
  desired_count   = 2

  deployment_controller {
    type = "EXTERNAL"
  }

  # Remove network_configuration block for external deployment controller
}

resource "aws_launch_template" "ecs_lt" {
  name_prefix   = "ecs-launch-template"
  image_id      = "ami-0c0ba4e76e4392ce9"  # Amazon ECS-optimized AMI for us-west-2
  instance_type = "t3.micro"

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
      Name = "ecs-instance"
    }
  }
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_autoscaling_group" "ecs_asg" {
  vpc_zone_identifier = [aws_subnet.subnet_1.id, aws_subnet.subnet_2.id]
  desired_capacity    = 2
  max_size            = 2
  min_size            = 2

  launch_template {
    id      = aws_launch_template.ecs_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = "true"
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
        --network-configuration "awsvpcConfiguration={subnets=[${aws_subnet.subnet_1.id},${aws_subnet.subnet_2.id}],assignPublicIp=DISABLED}" \
        --query 'taskSet.id' \
        --output text)
      
      # Update the service to use the new task set
      aws ecs update-service-primary-task-set \
        --cluster ${aws_ecs_cluster.my_cluster.name} \
        --service ${aws_ecs_service.my_service.name} \
        --task-set $TASK_SET_ID
      
      # Wait for the service to become stable
      aws ecs wait services-stable \
        --cluster ${aws_ecs_cluster.my_cluster.name} \
        --services ${aws_ecs_service.my_service.name}
      
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

output "test_deployment_result" {
  description = "Status of the ECS service after test deployment"
  value = jsondecode(file("${path.module}/deployment_status.json"))
}