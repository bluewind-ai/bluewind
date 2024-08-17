# Provider configuration
provider "aws" {
  region  = "us-west-2"
  profile = "ci-cd-admin"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "app-bluewind-vpc"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "app-bluewind-public-subnet-${count.index + 1}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "app-bluewind-igw"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "app-bluewind-public-route-table"
  }
}

# Route Table Association
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "app-bluewind-cluster"
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "app-bluewind-task"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([{
    name  = "app-bluewind-container"
    image = "nginx:latest"
    portMappings = [{
      containerPort = 80
      hostPort      = 0
    }]
  }])
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ecs_agent" {
  name = "app-bluewind-ecs-agent-profile"
  role = aws_iam_role.ecs_agent.name
}

# IAM Role for EC2 ECS Agent
resource "aws_iam_role" "ecs_agent" {
  name = "app-bluewind-ecs-agent-role"

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

# Attach ECS Agent policy to the role
resource "aws_iam_role_policy_attachment" "ecs_agent" {
  role       = aws_iam_role.ecs_agent.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

# Launch Template
resource "aws_launch_template" "ecs_lt" {
  name_prefix   = "app-bluewind-ecs-template"
  image_id      = "ami-0fe19057e9cb4efd8"
  instance_type = "t3.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_agent.name
  }

  vpc_security_group_ids = [aws_security_group.ecs_sg.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "app-bluewind-ecs-instance"
    }
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "app-bluewind-service"
  launch_type     = "EC2"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1

  ordered_placement_strategy {
    type  = "spread"
    field = "instanceId"
  }
}

# Security Group for ECS instances
resource "aws_security_group" "ecs_sg" {
  name        = "app-bluewind-ecs-sg"
  description = "Allow inbound traffic for ECS"
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

  tags = {
    Name = "app-bluewind-ecs-sg"
  }
}

# Data source for AZs
data "aws_availability_zones" "available" {}

# ECR Repository
# ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = "app-bluewind-repository"
  image_tag_mutability = "IMMUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name = "app-bluewind-ecr-repo"
  }
}