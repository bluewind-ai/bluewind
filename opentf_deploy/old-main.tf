# output "alb_http_url" {
#   description = "The HTTP URL of the Application Load Balancer"
#   value       = "http://${aws_lb.app.dns_name}"
# }

# data "local_file" "image_tag" {
#   depends_on = [null_resource.push_image]
#   filename   = "${path.module}/image_tag.txt"
# }

# variable "aws_access_key_id" {}
# variable "aws_secret_access_key" {}

# variable "region" {
#   description = "The AWS region to deploy resources in"
#   type        = string
#   default     = "us-west-2"  # You can change this default value if needed
# }

# # Provider configuration
# provider "aws" {
#   region  = var.region
#   profile = "ci-cd-admin-2"
# }

# # VPC
# # resource "aws_vpc" "main" {
# #   cidr_block           = "10.0.0.0/16"
# #   enable_dns_hostnames = true
# #   enable_dns_support   = true

# #   tags = {
# #     Name = "app-bluewind-vpc"
# #   }
# # }

# # Public Subnets
# resource "aws_subnet" "public" {
#   count                   = 2
#   vpc_id                  = aws_vpc.main.id
#   cidr_block              = "10.0.${count.index}.0/24"
#   availability_zone       = data.aws_availability_zones.available.names[count.index]
#   map_public_ip_on_launch = true

#   tags = {
#     Name = "app-bluewind-public-subnet-${count.index + 1}"
#   }
# }

# # Internet Gateway
# resource "aws_internet_gateway" "main" {
#   vpc_id = aws_vpc.main.id

#   tags = {
#     Name = "app-bluewind-igw"
#   }
# }

# # Route Table
# resource "aws_route_table" "public" {
#   vpc_id = aws_vpc.main.id

#   route {
#     cidr_block = "0.0.0.0/0"
#     gateway_id = aws_internet_gateway.main.id
#   }

#   tags = {
#     Name = "app-bluewind-public-route-table"
#   }
# }

# # Route Table Association
# resource "aws_route_table_association" "public" {
#   count          = 2
#   subnet_id      = aws_subnet.public[count.index].id
#   route_table_id = aws_route_table.public.id
# }

# # ECS Cluster
# resource "aws_ecs_cluster" "main" {
#   name = "app-bluewind-cluster"

#   setting {
#     name  = "containerInsights"
#     value = "enabled"
#   }
# }

# # ECS Task Definition
# # ECS Task Definition
# resource "aws_ecs_task_definition" "app" {
#   family                   = "app-bluewind-gunicorn"
#   network_mode             = "awsvpc"
#   requires_compatibilities = ["EC2"]
#   cpu                      = "256"
#   memory                   = "512"
#   execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

#   container_definitions = jsonencode([
#     {
#       name  = "app-bluewind-container"
#       image = "${aws_ecr_repository.app.repository_url}:${trimspace(data.local_file.image_tag.content)}"
#       portMappings = [{
#         containerPort = 8000
#         hostPort      = 8000
#       }]
#       environment = [
#         {
#           name  = "DEBUG"
#           value = "1"
#         },
#         {
#           name  = "SECRET_KEY"
#           value = "your_secret_key_here"
#         },
#         {
#           name  = "ALLOWED_HOSTS"
#           value = "localhost,127.0.0.1,${aws_lb.app.dns_name}"
#         },
#         {
#           name  = "DATABASE_ENGINE"
#           value = "django.db.backends.postgresql"
#         },
#         {
#           name  = "DB_USERNAME"
#           value = "dbadmin"
#         },
#         {
#           name  = "DB_PASSWORD"
#           value = "changeme123"
#         },
#         {
#           name  = "DB_HOST"
#           value = "app-bluewind-db.c50acykqkhaw.us-west-2.rds.amazonaws.com"
#         },
#         {
#           name  = "DB_PORT"
#           value = "5432"
#         },
#         {
#           name  = "DB_NAME"
#           value = "postgres"
#         },
#         {
#           name  = "DJANGO_SUPERUSER_EMAIL"
#           value = "admin@example.com"
#         },
#         {
#           name  = "DJANGO_SUPERUSER_USERNAME"
#           value = "admin@example.com"
#         },
#         {
#           name  = "DJANGO_SUPERUSER_PASSWORD"
#           value = "admin123"
#         },
#         {
#           name  = "ENVIRONMENT"
#           value = "staging"
#         },
#         {
#           name  = "CSRF_TRUSTED_ORIGINS"
#           # value = "https://${var.domain_name},http://${aws_lb.app.dns_name},https://${aws_lb.app.dns_name},https://${aws_cloudfront_distribution.app_distribution.domain_name}"
#           value = "http://${aws_lb.app.dns_name},https://${aws_lb.app.dns_name}"
#         }
#       ]
#       logConfiguration = {
#         logDriver = "awslogs"
#         options = {
#           "awslogs-group"         = "/ecs/app-bluewind"
#           "awslogs-region"        = var.region
#           "awslogs-stream-prefix" = "ecs"
#         }
#       }
#       healthCheck = {
#         command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
#         interval    = 5
#         timeout     = 2
#         retries     = 10
#         startPeriod = 1
#       }
#     }
#   ])
# }

# resource "aws_cloudwatch_log_group" "ecs_tasks" {
#   name              = "/ecs/app-bluewind"
#   retention_in_days = 30  # Adjust this value as needed

#   tags = {
#     Name = "app-bluewind-logs"
#   }
# }

# resource "aws_iam_role" "ecs_task_execution_role" {
#   name = "app-bluewind-ecs-task-execution-role"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "ecs-tasks.amazonaws.com"
#         }
#       }
#     ]
#   })
# }

# resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
#   role       = aws_iam_role.ecs_task_execution_role.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
# }


# # EC2 Instance Profile
# resource "aws_iam_instance_profile" "ecs_agent" {
#   name = "app-bluewind-ecs-agent-profile"
#   role = aws_iam_role.ecs_agent.name
# }

# resource "aws_cloudwatch_log_group" "ecs_agent_logs" {
#   name              = "/ecs/ecs-agent-logs"
#   retention_in_days = 30

#   tags = {
#     Name = "app-bluewind-ecs-agent-logs"
#   }
# }

# resource "aws_iam_role_policy" "ecs_agent_cloudwatch_logs" {
#   name = "ecs-agent-cloudwatch-logs"
#   role = aws_iam_role.ecs_agent.id

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "logs:CreateLogStream",
#           "logs:PutLogEvents",
#           "logs:DescribeLogStreams"
#         ]
#         Resource = "${aws_cloudwatch_log_group.ecs_agent_logs.arn}:*"
#       }
#     ]
#   })
# }

# # IAM Role for EC2 ECS Agent
# resource "aws_iam_role" "ecs_agent" {
#   name = "app-bluewind-ecs-agent-role"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "ec2.amazonaws.com"
#         }
#       }
#     ]
#   })
# }

# # Attach ECS Agent policy to the role
# resource "aws_iam_role_policy_attachment" "ecs_agent" {
#   role       = aws_iam_role.ecs_agent.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
# }


# data "aws_ssm_parameter" "ecs_optimized_ami" {
#   name = "/aws/service/ecs/optimized-ami/amazon-linux-2/arm64/recommended/image_id"
# }
# # Launch Template
# resource "aws_launch_template" "ecs_lt" {
#   name_prefix   = "app-bluewind-ecs-template"
#   image_id      = data.aws_ssm_parameter.ecs_optimized_ami.value
#   instance_type = "t4g.micro"

#   iam_instance_profile {
#     name = aws_iam_instance_profile.ecs_agent.name
#   }

#   vpc_security_group_ids = [aws_security_group.ecs_sg.id]

#   user_data = base64encode(<<-EOF
#               #!/bin/bash
#               echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
#               echo ECS_LOGLEVEL=debug >> /etc/ecs/ecs.config
#               echo ECS_LOGFILE=/var/log/ecs/ecs-agent.log >> /etc/ecs/ecs.config
#               echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
#               echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
#               echo ECS_ENABLE_TASK_ENI=true >> /etc/ecs/ecs.config
#               systemctl restart ecs
#               EOF
#   )

#   tag_specifications {
#     resource_type = "instance"
#     tags = {
#       Name = "app-bluewind-ecs-instance"
#     }
#   }
# }

# # ECS Service
# resource "aws_ecs_service" "app" {
#   name            = "app-bluewind-service"
#   cluster         = aws_ecs_cluster.main.id
#   task_definition = aws_ecs_task_definition.app.arn
#   desired_count   = 1
#   launch_type     = "EC2"

#   network_configuration {
#     subnets         = aws_subnet.public[*].id
#     security_groups = [aws_security_group.ecs_sg.id]
#   }
#   depends_on = [aws_lb_listener.app, aws_lb_target_group.app]


#   load_balancer {
#     target_group_arn = aws_lb_target_group.app.arn
#     container_name   = "app-bluewind-container"
#     container_port   = 8000
#   }
# }

# # Security Group for ECS instances
# resource "aws_security_group" "ecs_sg" {
#   name        = "app-bluewind-ecs-sg"
#   description = "Allow inbound traffic for ECS"
#   vpc_id      = aws_vpc.main.id

#   ingress {
#     from_port   = 0
#     to_port     = 65535
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   tags = {
#     Name = "app-bluewind-ecs-sg"
#   }
# }

# # Data source for AZs
# # data "aws_availability_zones" "available" {}

# # ECR Repository
# # ECR Repository
# resource "aws_ecr_repository" "app" {
#   name                 = "app-bluewind-repository"
#   image_tag_mutability = "IMMUTABLE"
  
#   image_scanning_configuration {
#     scan_on_push = true
#   }
  
#   tags = {
#     Name = "app-bluewind-ecr-repo"
#   }
# }

# resource "null_resource" "push_image" {
#   triggers = {
#     always_run = "${timestamp()}"  # This will always be different, triggering a run every time
#   }

#   provisioner "local-exec" {
#     command = <<EOF
#       set -e
#       echo "Building Docker image..."
#       docker build -t app-bluewind:latest ../
      
#       IMAGE_ID=$(docker images -q app-bluewind:latest)
      
#       echo "Image built with ID: $${IMAGE_ID}"
      
#       echo "Tagging image..."
#       docker tag $${IMAGE_ID} ${aws_ecr_repository.app.repository_url}:$${IMAGE_ID}
      
#       echo "Logging into ECR..."
#       aws ecr get-login-password --region ${var.region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}
      
#       echo "Pushing image to ECR..."
#       docker push ${aws_ecr_repository.app.repository_url}:$${IMAGE_ID}
      
#       echo "Image pushed successfully with tag: $${IMAGE_ID}"
#       echo "$${IMAGE_ID}" > ${path.module}/image_tag.txt
#     EOF

#     environment = {
#       AWS_ACCESS_KEY_ID     = var.aws_access_key_id
#       AWS_SECRET_ACCESS_KEY = var.aws_secret_access_key
#     }
#   }
# }

# # Auto Scaling Group
# resource "aws_autoscaling_group" "ecs" {
#   name                = "app-bluewind-ecs-asg"
#   vpc_zone_identifier = aws_subnet.public[*].id
#   min_size            = 2
#   max_size            = 3
#   desired_capacity    = 2
#   health_check_grace_period = 0

#   launch_template {
#     id      = aws_launch_template.ecs_lt.id
#     version = "$Latest"
#   }

#   tag {
#     key                 = "AmazonECSManaged"
#     value               = true
#     propagate_at_launch = true
#   }
#   force_delete = true
# }

# # ECS Capacity Provider
# resource "aws_ecs_capacity_provider" "ecs_cp" {
#   name = "app-bluewind-ecs-cp"

#   auto_scaling_group_provider {
#     auto_scaling_group_arn = aws_autoscaling_group.ecs.arn
    
#     managed_scaling {
#       maximum_scaling_step_size = 1000
#       minimum_scaling_step_size = 1
#       status                    = "ENABLED"
#       target_capacity           = 100
#     }
#   }
# }

# # Associate Capacity Provider with ECS Cluster
# resource "aws_ecs_cluster_capacity_providers" "ecs_cp_association" {
#   cluster_name       = aws_ecs_cluster.main.name
#   capacity_providers = [aws_ecs_capacity_provider.ecs_cp.name]

#   default_capacity_provider_strategy {
#     base              = 1
#     weight            = 100
#     capacity_provider = aws_ecs_capacity_provider.ecs_cp.name
#   }
# }

# resource "aws_lb" "app" {
#   name               = "app-bluewind-alb"
#   internal           = false
#   load_balancer_type = "application"
#   security_groups    = [aws_security_group.alb_sg.id]
#   subnets            = aws_subnet.public[*].id

#   tags = {
#     Name = "app-bluewind-alb"
#   }
# }

# # ALB Listener
# resource "aws_lb_listener" "app" {
#   load_balancer_arn = aws_lb.app.arn
#   port              = 80
#   protocol          = "HTTP"

#   default_action {
#     type = "fixed-response"
#     fixed_response {
#       content_type = "text/plain"
#       message_body = "Service Unavailable"
#       status_code  = "503"
#     }
#   }
# }

# # ALB Target Group
# resource "aws_lb_target_group" "app" {
#   name        = "app-bluewind-tg"
#   port        = 8000
#   protocol    = "HTTP"
#   vpc_id      = aws_vpc.main.id
#   target_type = "ip"
#   deregistration_delay = 5  # Set to 5 seconds

#   health_check {
#     path                = "/health"
#     healthy_threshold   = 2
#     unhealthy_threshold = 2
#     timeout             = 2
#     interval            = 5
#     matcher             = "200"
#   }
# }

# # Security Group for ALB
# resource "aws_security_group" "alb_sg" {
#   name        = "app-bluewind-alb-sg"
#   description = "Security group for ALB"
#   vpc_id      = aws_vpc.main.id

#   ingress {
#     from_port   = 80
#     to_port     = 80
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   tags = {
#     Name = "app-bluewind-alb-sg"
#   }
# }

# # RDS Instance
# resource "aws_db_instance" "default" {
#   identifier           = "app-bluewind-db"
#   engine               = "postgres"
#   engine_version       = "16"
#   instance_class       = "db.t4g.micro"
#   allocated_storage    = 20
#   storage_type         = "gp2"
#   db_name              = "appbluewinddb"
#   username             = "dbadmin"
#   password             = "changeme123"  # Please change this password
#   parameter_group_name = "default.postgres16"
#   skip_final_snapshot  = true
#   publicly_accessible  = true

#   vpc_security_group_ids = [aws_security_group.rds_sg.id]
#   db_subnet_group_name   = aws_db_subnet_group.default.name
# }

# # DB Subnet Group
# resource "aws_db_subnet_group" "default" {
#   name       = "app-bluewind-db-subnet-group"
#   subnet_ids = aws_subnet.public[*].id

#   tags = {
#     Name = "App BlueWind DB subnet group"
#   }
# }

# # Security Group for RDS
# resource "aws_security_group" "rds_sg" {
#   name        = "app-bluewind-rds-sg"
#   description = "Allow inbound traffic for RDS"
#   vpc_id      = aws_vpc.main.id

#   ingress {
#     from_port   = 5432
#     to_port     = 5432
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   tags = {
#     Name = "app-bluewind-rds-sg"
#   }
# }

# # Output the RDS endpoint
# output "rds_endpoint" {
#   description = "The connection endpoint for the RDS instance"
#   value       = aws_db_instance.default.endpoint
# }

# resource "null_resource" "deploy_ecs_service" {
#   depends_on = [aws_ecs_task_definition.app, null_resource.push_image, aws_ecs_service.app]

#   triggers = {
#     always_run = "${timestamp()}"
#   }

#   provisioner "local-exec" {
#     command = <<EOF
#       #!/bin/bash
#       set -e

#       # Get the latest task definition
#       TASK_DEFINITION_ARN=$(aws ecs list-task-definitions --family-prefix app-bluewind-gunicorn --sort DESC --max-items 1 --query 'taskDefinitionArns[0]' --output text)

#       if [ -z "$TASK_DEFINITION_ARN" ]; then
#         echo "Error: No task definition found for family app-bluewind-gunicorn"
#         exit 1
#       fi

#       echo "Using task definition: $TASK_DEFINITION_ARN"

#       # Create a new task set
#       aws ecs create-task-set \
#         --cluster ${aws_ecs_cluster.main.name} \
#         --service ${aws_ecs_service.app.name} \
#         --task-definition $TASK_DEFINITION_ARN \
#         --external-id $(uuidgen) \
#         --network-configuration "awsvpcConfiguration={subnets=[${join(",", aws_subnet.public[*].id)}],securityGroups=[${aws_security_group.ecs_sg.id}],assignPublicIp=ENABLED}"

#       if [ $? -ne 0 ]; then
#         echo "Error: Failed to create task set"
#         exit 1
#       fi

#       echo "New task set created successfully!"
#       aws ecs update-service \
#         --cluster ${aws_ecs_cluster.main.name} \
#         --service ${aws_ecs_service.app.name} \
#         --task-definition $TASK_DEFINITION_ARN \
#         --force-new-deployment
#     EOF

#     environment = {
#       AWS_ACCESS_KEY_ID     = var.aws_access_key_id
#       AWS_SECRET_ACCESS_KEY = var.aws_secret_access_key
#       AWS_DEFAULT_REGION    = var.region
#     }
#   }
# }


# # check deployment status

# # resource "null_resource" "check_ecs_deployment" {
# #   depends_on = [null_resource.push_image, aws_ecs_service.app, aws_ecs_task_definition.app]

# #   triggers = {
# #     always_run = "${timestamp()}"
# #   }

# #   provisioner "local-exec" {
# #     command = <<EOF
# #       #!/bin/bash
# #       set -e

# #       cluster_name="${aws_ecs_cluster.main.name}"
# #       service_name="${aws_ecs_service.app.name}"
# #       max_attempts=20
# #       sleep_time=1

# #       for ((i=1; i<=max_attempts; i++)); do
# #         echo "Attempt $i/$max_attempts: Checking ECS service status..."
        
# #         deployment_status=$(aws ecs describe-services \
# #           --cluster "$cluster_name" \
# #           --services "$service_name" \
# #           --query 'services[0].deployments[0].rolloutState' \
# #           --output text)

# #         if [ "$deployment_status" == "COMPLETED" ]; then
# #           echo "Deployment completed successfully!"
# #           exit 0
# #         elif [ "$deployment_status" == "FAILED" ]; then
# #           echo "Deployment failed. Fetching task details..."
# #           task_arn=$(aws ecs list-tasks \
# #             --cluster "$cluster_name" \
# #             --service-name "$service_name" \
# #             --desired-status STOPPED \
# #             --query 'taskArns[0]' \
# #             --output text)
          
# #           if [ "$task_arn" != "None" ]; then
# #             aws ecs describe-tasks \
# #               --cluster "$cluster_name" \
# #               --tasks "$task_arn"
# #           fi
          
# #           exit 1
# #         else
# #           echo "Deployment status: $deployment_status. Waiting..."
# #           sleep $sleep_time
# #         fi
# #       done

# #       echo "Deployment did not complete within the expected time."
# #       exit 1
# #     EOF

# #     environment = {
# #       AWS_ACCESS_KEY_ID     = var.aws_access_key_id
# #       AWS_SECRET_ACCESS_KEY = var.aws_secret_access_key
# #       AWS_SESSION_TOKEN     = var.aws_session_token
# #       AWS_DEFAULT_REGION    = var.region
# #     }
# #   }
# # }