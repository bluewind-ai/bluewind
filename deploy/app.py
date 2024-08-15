#!/usr/bin/env python3
import os
from aws_cdk import App, Environment
from django_fargate_cdk_stack import SimpleFargateCdkStack
from dotenv import load_dotenv

load_dotenv()


app = App()

SimpleFargateCdkStack(app, "DjangoFargateCdkStack6",
    env=Environment(
        account=os.getenv("AWS_ACCOUNT_ID"),
        region="us-west-2"
    ),
)

app.synth()