import asyncio
import json
import logging
import os
import time

import boto3
from botocore.exceptions import ClientError

from ci_utils import run_command

logger = logging.getLogger("django.not_used")


def get_secret_keys_and_values():
    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager", region_name="us-west-2")
    get_secret_value_response = client.get_secret_value(
        SecretId=os.environ["SECRET_ARN"]
    )
    secret = json.loads(get_secret_value_response["SecretString"])
    return secret.items()


def build_and_push_docker_image(output_data, log_file, env, verbose=True):
    with open("last_deployment.json", "r") as file:
        last_deployment = json.load(file)

    previous_image_id = last_deployment["image_id"]

    build_commands = [
        "set -e",
        "docker build -t app-bluewind:latest .",
        "IMAGE_ID=$(docker images -q app-bluewind:latest)",
        "echo $IMAGE_ID > image_id.txt",
    ]

    run_command(" && ".join(build_commands), log_file, env=env, verbose=verbose)

    with open("image_id.txt", "r") as file:
        new_image_id = file.read().strip()

    assert new_image_id, "Error: No image ID found"

    if new_image_id != previous_image_id:
        push_commands = [
            "set -e",
            f"docker tag {new_image_id} {
                output_data['ecr_repository_url']['value']}:{new_image_id}",
            f"aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin {
                output_data['ecr_repository_url']['value']}",
            f"docker push {
                output_data['ecr_repository_url']['value']}:{new_image_id}",
        ]
        for command in push_commands:
            run_command(command, log_file, env=env, verbose=verbose)

        # keep this for later
        last_deployment = {"image_id": new_image_id}

        with open("last_deployment.json", "w") as file:
            json.dump(last_deployment, file, indent=2)

        return new_image_id

    return previous_image_id


def run_deploy(log_file, verbose=True):
    logger.debug("running logs in", log_file)
    logger.debug("Starting deployment process")

    env = os.environ.copy()
    if os.path.exists(".aws"):
        with open(".aws", "r") as f:
            for line in f:
                if "=" in line:
                    key, value = line.strip().split("=", 1)
                    env[key] = value
    env.update(
        {
            "TF_VAR_aws_access_key_id": env["AWS_ACCESS_KEY_ID"],
            "TF_VAR_aws_secret_access_key": env["AWS_SECRET_ACCESS_KEY"],
            "TF_VAR_app_name": "bluewind-app",
            "TF_VAR_secret_arn": env["SECRET_ARN"],
            "TF_VAR_secret_db_arn": env["SECRET_DB_ARN"],
            "TF_VAR_db_password": env["DB_PASSWORD"],
            "TF_VAR_db_username": env["DB_USERNAME"],
            "TF_VAR_db_name": env["DB_NAME"],
        }
    )

    logger.debug("Running OpenTofu commands")
    combined_command = (
        "cd opentf_deploy && "
        "tofu init && "
        "tofu apply -lock=false --auto-approve && "
        "tofu output -json > ../tofu_output.json"
    )

    run_command(combined_command, log_file, env=env, verbose=verbose)

    logger.debug("OpenTofu commands completed successfully")
    with open("tofu_output.json", "r") as f:
        output_data = json.load(f)

    image_id = build_and_push_docker_image(output_data, log_file, env, verbose)

    elbv2_client = boto3.client(
        "elbv2",
        aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
        region_name="us-west-2",
    )
    service_name = output_data["ecs_service_name"]["value"]

    logger.debug("Reading OpenTofu output")

    cluster_arn = output_data["ecs_cluster_arn"]["value"]
    service_name = output_data["ecs_service_name"]["value"]
    ecs_task_execution_role_arn = output_data["ecs_task_execution_role_arn"]["value"]
    cloudwatch_log_group_name = output_data["cloudwatch_log_group_name"]["value"]

    new_target_group_response = elbv2_client.create_target_group(
        Name=f"tg-{service_name}-{int(time.time())}",
        Protocol="HTTP",
        Port=8000,
        VpcId=output_data["vpc_id"]["value"],
        TargetType="instance",
        # HealthCheckProtocol='HTTP',
        # HealthCheckPath='/',
        # HealthCheckEnabled=True,
        # HealthCheckIntervalSeconds=5,
        # HealthCheckTimeoutSeconds=2,
        # HealthyThresholdCount=2,
        # UnhealthyThresholdCount=2,
        # Matcher={
        #     'HttpCode': '200-299'
        # }
    )

    new_target_group_arn = new_target_group_response["TargetGroups"][0][
        "TargetGroupArn"
    ]

    elbv2_client.modify_target_group_attributes(
        TargetGroupArn=new_target_group_arn,
        Attributes=[{"Key": "deregistration_delay.timeout_seconds", "Value": "10"}],
    )

    logger.debug(f"Cluster ARN: {cluster_arn}")
    logger.debug(f"Service Name: {service_name}")

    logger.debug("Initializing ECS client")
    ecs_client = boto3.client(
        "ecs",
        aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
        region_name="us-west-2",
    )

    logger.debug("Creating new task definition")
    # with open("opentf_deploy/image_tag.txt", 'r') as f:
    #     image_id = f.read().strip()

    client = boto3.client(
        "secretsmanager",
        aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
        region_name="us-west-2",
    )

    get_secret_value_response = client.get_secret_value(
        SecretId=os.environ["SECRET_ARN"]
    )

    secrets = json.loads(get_secret_value_response["SecretString"])
    del secrets["DB_HOST"]
    del secrets["DB_PASSWORD"]
    secrets = [
        {"name": key, "valueFrom": f"{os.environ["SECRET_ARN"]}:{key}::"}
        for key, _ in secrets.items()
    ]
    logger.debug(secrets)
    secrets += [
        {"name": "DB_HOST", "valueFrom": f"{os.environ["SECRET_DB_ARN"]}:DB_HOST::"},
        {
            "name": "DB_PASSWORD",
            "valueFrom": f"{os.environ["SECRET_DB_ARN"]}:DB_PASSWORD::",
        },
    ]
    logger.debug(secrets)

    task_definition_response = ecs_client.register_task_definition(
        family="app-task",
        taskRoleArn=ecs_task_execution_role_arn,
        executionRoleArn=ecs_task_execution_role_arn,
        networkMode="bridge",
        requiresCompatibilities=["EC2"],
        containerDefinitions=[
            {
                "name": "app-container",
                "image": f"{output_data['ecr_repository_url']['value']}:{image_id}",
                "memory": 1024,
                "cpu": 1024,
                "portMappings": [
                    {"containerPort": 8000, "hostPort": 0}
                ],  # Use dynamic host port mapping
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": cloudwatch_log_group_name,
                        "awslogs-region": "us-west-2",
                        "awslogs-stream-prefix": "ecs",
                    },
                },
                "secrets": secrets,
            }
        ],
    )
    task_definition = f"{
        task_definition_response['taskDefinition']['family']}:{
        task_definition_response['taskDefinition']['revision']}"
    logger.debug(f"New task definition created: {task_definition}")

    logger.debug("Describing ECS service")
    service_description = ecs_client.describe_services(
        cluster=cluster_arn, services=[service_name]
    )

    task_sets = service_description["services"][0].get("taskSets", [])
    active_task_sets = [
        task_set for task_set in task_sets if task_set["status"] != "DRAINING"
    ]

    logger.debug(json.dumps(active_task_sets, indent=4, sort_keys=True, default=str))
    logger.debug(f"Found {len(active_task_sets)} existing task sets")

    if len(active_task_sets) > 1:
        logger.debug(
            f"Found {len(active_task_sets)} task sets. Deleting excess task sets."
        )
        for task_set in active_task_sets:
            task_set_arn = task_set["taskSetArn"]
            ecs_client.delete_task_set(
                cluster=cluster_arn,
                service=service_name,
                taskSet=task_set_arn,
                force=True,
            )
        logger.debug(
            f"Error: Found {len(active_task_sets)} task sets after OpenTofu operations. Expected 1 or fewer."
        )
        return

    logger.debug("Creating new task set")
    try:
        response = ecs_client.create_task_set(
            cluster=cluster_arn,
            service=service_name,
            taskDefinition=task_definition,
            launchType="EC2",
            scale={"value": 100, "unit": "PERCENT"},
            loadBalancers=[
                {
                    "targetGroupArn": new_target_group_arn,
                    "containerName": "app-container",
                    "containerPort": 8000,
                }
            ],
        )
        new_task_set_id = response["taskSet"]["id"]
        logger.debug(f"New task set created with ID: {new_task_set_id}")
    except ClientError as e:
        logger.debug(f"Error creating task set: {e}")
        return False

    if len(active_task_sets) == 0:
        logger.debug("No task was running in this environment previously")

    logger.debug("Waiting for new task set to reach steady state")
    max_attempts = 70
    delay = 1

    certificate_arn = "arn:aws:acm:us-west-2:484907521409:certificate/4578643a-1b4c-4810-97d2-dfa9d6680596"

    existing_listeners = elbv2_client.describe_listeners(
        LoadBalancerArn=output_data["alb_arn"]["value"]
    )

    for attempt in range(1, max_attempts + 1):
        response = ecs_client.describe_task_sets(
            cluster=cluster_arn,
            service=service_name,
            taskSets=[new_task_set_id],
        )
        logger.debug(
            f"Attempt {attempt}: Task set status: {response['taskSets'][0]['stabilityStatus']}"
        )
        if response["taskSets"][0]["stabilityStatus"] == "STEADY_STATE":
            logger.debug("New task set reached steady state")

            existing_listeners = elbv2_client.describe_listeners(
                LoadBalancerArn=output_data["alb_arn"]["value"]
            )

            green_listener = next(
                (
                    listener
                    for listener in existing_listeners["Listeners"]
                    if listener["Port"] == 8080
                ),
                None,
            )
            if green_listener:
                green_listener_arn = green_listener["ListenerArn"]

                response = elbv2_client.modify_listener(
                    ListenerArn=green_listener_arn,
                    DefaultActions=[
                        {"Type": "forward", "TargetGroupArn": new_target_group_arn}
                    ],
                )
            else:
                elbv2_client.create_listener(
                    LoadBalancerArn=output_data["alb_arn"]["value"],
                    Protocol="HTTP",
                    Port=8080,
                    DefaultActions=[
                        {"Type": "forward", "TargetGroupArn": new_target_group_arn}
                    ],
                )

            # if not run_e2e_prod_green('logs/test.log', verbose=True):
            #     raise("E2E prod green failed")

            https_listener = next(
                (
                    listener
                    for listener in existing_listeners["Listeners"]
                    if listener["Port"] == 443
                ),
                None,
            )
            if https_listener:
                https_listener_arn = https_listener["ListenerArn"]
                elbv2_client.modify_listener(
                    ListenerArn=https_listener_arn,
                    Port=443,
                    Protocol="HTTPS",
                    SslPolicy="ELBSecurityPolicy-2016-08",
                    Certificates=[{"CertificateArn": certificate_arn}],
                    DefaultActions=[
                        {"Type": "forward", "TargetGroupArn": new_target_group_arn}
                    ],
                )
            else:
                elbv2_client.create_listener(
                    LoadBalancerArn=output_data["alb_arn"]["value"],
                    Port=443,
                    Protocol="HTTPS",
                    SslPolicy="ELBSecurityPolicy-2016-08",
                    Certificates=[{"CertificateArn": certificate_arn}],
                    DefaultActions=[
                        {"Type": "forward", "TargetGroupArn": new_target_group_arn}
                    ],
                )
            logger.debug("Deleting old task set")
            if len(active_task_sets) == 1:
                ecs_client.delete_task_set(
                    cluster=cluster_arn,
                    service=service_name,
                    taskSet=active_task_sets[0]["taskSetArn"],
                )
            logger.debug("Deployment completed successfully")
            return True
        asyncio.sleep(delay)
    ecs_client.delete_task_set(
        cluster=cluster_arn, service=service_name, taskSet=new_task_set_id, force=True
    )
    logger.debug(
        "Deployment failed: New task set did not reach steady state within the timeout period"
    )
    return False
