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

resource "aws_ecs_service" "my_service" {
  name          = "my-service"
  cluster       = aws_ecs_cluster.my_cluster.id
  desired_count = 1

  deployment_controller {
    type = "EXTERNAL"
  }

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.main.name
    weight            = 100
  }

  lifecycle {
    ignore_changes = [
      capacity_provider_strategy
      , task_definition,
    ]
  }
}

data "aws_ssm_parameter" "ecs_optimized_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/arm64/recommended/image_id"
}

resource "aws_launch_template" "ecs_lt" {
  name_prefix   = "ecs-launch-template"
  image_id      = data.aws_ssm_parameter.ecs_optimized_ami.value
  instance_type = "t4g.small"

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
echo ECS_LOGLEVEL=debug >> /etc/ecs/ecs.config
echo ECS_AVAILABLE_LOGGING_DRIVERS='["json-file","awslogs"]' >> /etc/ecs/ecs.config
echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true >> /etc/ecs/ecs.config
yum install -y awslogs
systemctl enable awslogsd.service
systemctl start awslogsd.service

# Configure CloudWatch Logs
cat <<'EOT' > /etc/awslogs/awslogs.conf
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = /ec2/messages
log_stream_name = {instance_id}
datetime_format = %b %d %H:%M:%S

[/var/log/ecs/ecs-init.log]
file = /var/log/ecs/ecs-init.log
log_group_name = /ec2/ecs-init
log_stream_name = {instance_id}
datetime_format = %Y-%m-%d %H:%M:%S

[/var/log/ecs/ecs-agent.log]
file = /var/log/ecs/ecs-agent.log
log_group_name = /ec2/ecs-agent
log_stream_name = {instance_id}
datetime_format = %Y-%m-%d %H:%M:%S

[/var/log/docker]
file = /var/log/docker
log_group_name = /ec2/docker
log_stream_name = {instance_id}
datetime_format = %Y-%m-%d %H:%M:%S
EOT

# Restart CloudWatch Logs agent
systemctl restart awslogsd
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
  max_size            = 4
  min_size            = 2

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


resource "aws_ecs_task_definition" "app_task_definition" {
  family                   = "app-task"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  
  container_definitions = jsonencode([
    {
      name  = "app-container"
      image = "nginx:latest"
      memory = 1024
      cpu = 1024
      portMappings = [{
          containerPort = 80
          hostPort      = 0  # Dynamic port mapping
      }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/app-bluewind"
          "awslogs-region"        = "us-west-2"
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }
      environment = [
        {
          name  = "ECS_ENABLE_CONTAINER_METADATA" 
          value = "true"
        }
      ]
    }
  ])
}


resource "aws_cloudwatch_log_group" "ecs_tasks" {
  name              = "/ecs/app-bluewind"
  retention_in_days = 30  # Adjust this value as needed

  tags = {
    Name = "app-bluewind-logs"
  }
}

output "ecs_cluster_arn" {
  value = aws_ecs_cluster.my_cluster.arn
}

output "ecs_service_name" {
  value = aws_ecs_service.my_service.name
}

output "task_definition_name_and_revision" {
  value = format("%s:%s",
    aws_ecs_task_definition.app_task_definition.family,
    split("/", aws_ecs_task_definition.app_task_definition.arn)[1]
  )
}

resource "aws_ecr_repository" "app" {
  name                 = "app-bluewind-repository"
  image_tag_mutability = "IMMUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name = "${var.app_name}-ecr-repo"
  }
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.app.repository_url
  description = "The URL of the ECR repository"
}