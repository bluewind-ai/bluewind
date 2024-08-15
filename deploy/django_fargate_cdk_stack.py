import datetime
import os
import subprocess
from aws_cdk import (
    Stack,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_rds as rds,
    CfnOutput,
    RemovalPolicy,
    Duration,
)
from constructs import Construct
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_secretsmanager as secretsmanager
from aws_cdk import Fn
from aws_cdk import SecretValue
import random
import string
import json
from aws_cdk import aws_certificatemanager as acm



class SimpleFargateCdkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        configs = {
            "staging": {
                "debug": "True",
                "instance_type": ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
                "cpu": 256,
                "memory_limit_mib": 512,
                "desired_count": 1,
                "cache_policy": cloudfront.CachePolicy.CACHING_DISABLED,
                "backup_retention": Duration.days(7),
                "removal_policy": RemovalPolicy.DESTROY,
                "max_azs": 1,
                "domain_name": "staging.bluewind.ai",
                "certificate_arn": "arn:aws:acm:us-east-1:361769569102:certificate/e12139f7-7309-49b7-bf0d-01ba2a3b7a20"
            },
            "prod": {
                "debug": "False",
                "instance_type": ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
                "cpu": 256,
                "memory_limit_mib": 512,
                "desired_count": 2,
                "cache_policy": cloudfront.CachePolicy.CACHING_OPTIMIZED,
                "backup_retention": Duration.days(30),
                "removal_policy": RemovalPolicy.RETAIN,
                "max_azs": 2,
                "domain_name": "app.bluewind.ai",
                "certificate_arn": "arn:aws:acm:us-east-1:484907521409:certificate/c8fcaf6d-0f2f-482c-850f-c0494e32464c"
            },
        }
        env = os.environ.get('ENVIRONMENT')

        config = configs[env]

        certificate = acm.Certificate.from_certificate_arn(
            self, "Certificate",
            certificate_arn=config["certificate_arn"]
        )

        vpc = ec2.Vpc(self, "MyVPC", max_azs=config["max_azs"])

        cluster = ecs.Cluster(self, "MyCluster", vpc=vpc)
        
        build_args = {'TIMESTAMP': datetime.datetime.now().isoformat()}

        # Create S3 bucket for static files
        static_bucket = s3.Bucket(
            self, "StaticBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
        )

        oai = cloudfront.OriginAccessIdentity(self, "MyOAI")

        static_bucket.grant_read(oai)

        # pushing to S3 before even knowing that fargate deployment is successful is not a good idea

        # s3deploy.BucketDeployment(
        #     self, "DeployStaticFiles",
        #     sources=[s3deploy.Source.asset("../staticfiles")],  # Adjust this path to your static files
        #     destination_bucket=static_bucket,
        # )

        # Create RDS instance
        db_instance = rds.DatabaseInstance(
            self, "MyRDSInstance",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_13),
            instance_type=config["instance_type"],
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            allocated_storage=20,
            max_allocated_storage=100,
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
            backup_retention=config["backup_retention"],
            multi_az=False,
            publicly_accessible=True,
        )

        # Allow incoming traffic on the database port from anywhere
        db_instance.connections.allow_from(ec2.Peer.any_ipv4(), ec2.Port.tcp(5432))
        
        rds_secret = db_instance.secret
        secret_name = f"{self.stack_name}-{env}-django-admin-credentials"
        email = f"{env}-admin@bluewind.ai"
        
        django_superuser_secret = secretsmanager.Secret(
            self, "DjangoAdminSecretCreation",
            secret_name=secret_name,
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({
                    "DJANGO_SUPERUSER_EMAIL": email,
                    "DJANGO_SUPERUSER_USERNAME": email,
                }),
                generate_string_key="DJANGO_SUPERUSER_PASSWORD",
                exclude_punctuation=True,
                password_length=32
            )
        )
        print(email)

        fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, "MyFargateService",
            cluster=cluster,
            cpu=config["cpu"],
            memory_limit_mib=config["memory_limit_mib"],
            desired_count=config["desired_count"],
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_asset("../", build_args=build_args),
                container_port=8000,
                secrets={
                    "DB_USERNAME": ecs.Secret.from_secrets_manager(rds_secret, field="username"),
                    "DB_PASSWORD": ecs.Secret.from_secrets_manager(rds_secret, field="password"),
                    "DB_HOST": ecs.Secret.from_secrets_manager(rds_secret, field="host"),
                    "DB_PORT": ecs.Secret.from_secrets_manager(rds_secret, field="port"),
                    "DJANGO_SUPERUSER_EMAIL": ecs.Secret.from_secrets_manager(django_superuser_secret, field="DJANGO_SUPERUSER_EMAIL"),
                    "DJANGO_SUPERUSER_USERNAME": ecs.Secret.from_secrets_manager(django_superuser_secret, field="DJANGO_SUPERUSER_USERNAME"),
                    "DJANGO_SUPERUSER_PASSWORD": ecs.Secret.from_secrets_manager(django_superuser_secret, field="DJANGO_SUPERUSER_PASSWORD"),
                },
            ),
            public_load_balancer=True,
            health_check_grace_period=Duration.seconds(60),  # This is now in the correct place
        )

        fargate_service.target_group.configure_health_check(
            path="/health/",  # Adjust this to match your health check endpoint
            healthy_http_codes="200",
            interval=Duration.seconds(30),
            timeout=Duration.seconds(15),
            healthy_threshold_count=2,
            unhealthy_threshold_count=3,
        )

        # Get the load balancer's DNS name
        lb_dns_name = fargate_service.load_balancer.load_balancer_dns_name
        cloudfront_logs_bucket = s3.Bucket(
            self, "CloudFrontLogsBucket",
            removal_policy=RemovalPolicy.RETAIN,
            encryption=s3.BucketEncryption.S3_MANAGED,
            object_ownership=s3.ObjectOwnership.OBJECT_WRITER,
        )

        distribution = cloudfront.Distribution(
            self, "MyDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.LoadBalancerV2Origin(
                    fargate_service.load_balancer,
                    protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                cache_policy=config["cache_policy"],
                origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER,
            ),
            additional_behaviors={
                "/staticfiles/*": cloudfront.BehaviorOptions(
                    origin=origins.S3Origin(static_bucket, origin_access_identity=oai),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                )
            },
            enable_logging=True,
            log_bucket=cloudfront_logs_bucket,
            log_file_prefix="cloudfront-logs/",
            domain_names=[config["domain_name"]],  # Add this line
            certificate=certificate,  # Add this line
        )

        # Update the container's environment variables

        fargate_service.task_definition.default_container.add_environment(
            "SECRET_KEY", "TO_BE_REPLACED"
        )

        fargate_service.task_definition.default_container.add_environment(
            "DEBUG", "True"
        )

        fargate_service.task_definition.default_container.add_environment(
            "ENVIRONMENT", "staging"
        )

        fargate_service.task_definition.default_container.add_environment(
            "ALLOWED_HOSTS", f"{config['domain_name']},{lb_dns_name},localhost,127.0.0.1,localhost,127.0.0.1,0.0.0.0,10.0.0.0/8,*"
        )
        fargate_service.task_definition.default_container.add_environment(
            "CSRF_TRUSTED_ORIGINS", f"https://{config['domain_name']},http://{lb_dns_name},https://{lb_dns_name},https://{distribution.distribution_domain_name}"
        )

        fargate_service.task_definition.default_container.add_environment(
            "STATIC_URL", f"https://{config['domain_name']}/staticfiles/,https://{distribution.distribution_domain_name}/staticfiles/"
        )

        # Grant the Fargate task permission to access the RDS instance
        db_instance.connections.allow_default_port_from(fargate_service.service.connections)