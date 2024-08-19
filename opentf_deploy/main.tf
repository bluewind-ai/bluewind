provider "aws" {
  region = "us-west-2"  # or your preferred region
  profile = "ci-cd-admin-2"

}

resource "aws_ecs_cluster" "my_cluster" {
  name = "my-cluster"
}

# Create an ECS task definition
resource "aws_ecs_task_definition" "my_task" {
  family                   = "my-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]
  
  container_definitions = jsonencode([
    {
      name  = "my-container"
      image = "nginx:latest"
      memory = 512  # Specify the amount of memory in MiB
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]
    }
  ])

  
}

# Create an ECS service
resource "aws_ecs_service" "my_service" {
  name            = "my-service"
  cluster         = aws_ecs_cluster.my_cluster.id
  desired_count   = 2  # This will create 2 EC2 instances

  deployment_controller {
    type = "EXTERNAL"
  }

  network_configuration {
    subnets = ["subnet-actual1", "subnet-actual2"]  # Replace with your actual subnet IDs
    assign_public_ip = true
  }
  
}

# Create a launch template for EC2 instances
resource "aws_launch_template" "ecs_lt" {
  name_prefix   = "ecs-launch-template"
  image_id      = "ami-12345678"  # Replace with ECS-optimized AMI ID for your region
  instance_type = "t3.micro"

  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${aws_ecs_cluster.my_cluster.name} >> /etc/ecs/ecs.config
              EOF
  )
}

# Create an Auto Scaling group for ECS
resource "aws_autoscaling_group" "ecs_asg" {
  vpc_zone_identifier = ["subnet-actual1", "subnet-actual2"]  # Replace with your actual subnet IDs
  desired_capacity    = 2
  max_size            = 2
  min_size            = 2

  launch_template {
    id      = aws_launch_template.ecs_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = true
    propagate_at_launch = true
  }
}