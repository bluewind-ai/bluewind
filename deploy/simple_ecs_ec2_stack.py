import os
from aws_cdk import (
    Stack,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ec2 as ec2,
    aws_autoscaling as autoscaling,
    Duration,
)
from constructs import Construct

class SimpleEcsEC2Stack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        env = os.environ.get('ENVIRONMENT', 'staging')
        
        configs = {
            "staging": {
                "instance_type": ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
                "cpu": 256,
                "memory_limit_mib": 1024,
                "desired_count": 1,
                "max_azs": 2,
            },
            "prod": {
                "instance_type": ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
                "cpu": 512,
                "memory_limit_mib": 1024,
                "desired_count": 2,
                "max_azs": 2,
            },
        }
        config = configs[env]

        vpc = ec2.Vpc(self, "MyVPC",
            max_azs=config["max_azs"],
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
        )

        cluster = ecs.Cluster(self, "MyCluster", vpc=vpc)

        auto_scaling_group = autoscaling.AutoScalingGroup(
            self, "ASG",
            vpc=vpc,
            instance_type=config["instance_type"],
            machine_image=ecs.EcsOptimizedImage.amazon_linux2(),
            min_capacity=1,
            max_capacity=3,
        )

        capacity_provider = ecs.AsgCapacityProvider(
            self, "AsgCapacityProvider",
            auto_scaling_group=auto_scaling_group
        )
        cluster.add_asg_capacity_provider(capacity_provider)

        task_definition = ecs.Ec2TaskDefinition(
            self, "TaskDef",
            network_mode=ecs.NetworkMode.AWS_VPC,
        )

        container = task_definition.add_container(
            "web",
            image=ecs.ContainerImage.from_asset("../"),
            memory_limit_mib=config["memory_limit_mib"],
            cpu=config["cpu"],
            environment={
                "ENVIRONMENT": env,
                "DEBUG": "False",
                "ALLOWED_HOSTS": "*",
            },
            logging=ecs.LogDrivers.aws_logs(stream_prefix="ecs"),
        )

        container.add_port_mappings(ecs.PortMapping(container_port=8000))

        ec2_service = ecs_patterns.ApplicationLoadBalancedEc2Service(
            self, "EC2Service",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=config["desired_count"],
            public_load_balancer=True,
            health_check_grace_period=Duration.seconds(60),
        )

        ec2_service.target_group.configure_health_check(
            path="/health/",
            healthy_http_codes="200",
            interval=Duration.seconds(30),
            timeout=Duration.seconds(5),
            healthy_threshold_count=2,
            unhealthy_threshold_count=3,
        )

        ec2_service.target_group.set_attribute(
            key="deregistration_delay.timeout_seconds",
            value="30"
        )