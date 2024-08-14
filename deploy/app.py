#!/usr/bin/env python3
from aws_cdk import App, Environment
from django_fargate_cdk_stack import SimpleFargateCdkStack
from dotenv import load_dotenv

load_dotenv()


app = App()

SimpleFargateCdkStack(app, "DjangoFargateCdkStack5",
    env=Environment(
        account="361769569102",
        region="us-west-2"
    ),
)

app.synth()