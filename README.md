# DISCUSSION FORUM BACKEND

This repo contains infrastructure setup using AWS CDK and AWS lambda function handlers for discussion forum backend. Following AWS services are used.

1. API Gateway (REST API)
2. Lambda (Node JS)
3. DynamoDB

_CAUTION_ All the resources created using CDK will have `RemovalPolicy` set to `DESTROY`. To retain any resource update it appropriately.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## TODOS

- [ ] Get Channel by ID - Perhaps use Elasticache or DAX
- [ ] Support DELETE APIs
