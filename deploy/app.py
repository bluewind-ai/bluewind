#!/usr/bin/env python3
import os
from aws_cdk import App, Environment
from deploy.simple_ecs_ec2_stack import SimpleEcsEC2Stack
from django_fargate_cdk_stack import SimpleEcsCdkStack
from dotenv import load_dotenv

load_dotenv()


app = App()

# SimpleEcsCdkStack(app, "DjangoFargateCdkStack4",
#     env=Environment(
#         account=os.getenv("AWS_ACCOUNT_ID"),
#         region="us-west-2"
#     ),
# )

SimpleEcsEC2Stack(app, "DjangoFargateCdkStack6",
    env=Environment(
        account=os.getenv("AWS_ACCOUNT_ID"),
        region="us-west-2"
    ),
)

app.synth()