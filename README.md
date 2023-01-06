# DISCUSSION FORUM BACKEND

This repo contains infrastructure setup using AWS CDK and AWS lambda function handlers for discussion forum backend. Following AWS services are used.

1. API Gateway (REST API)
2. Lambda (Node JS)
3. DynamoDB

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## TODOS

- [x] Integrate Cognito User pool
- [x] Authorize APIs based on Cognito Roles (Cognito/ Lambda authorizers)
- [ ] Update some/ all lambdas to check access to channel for user from Cognito auth token
- [ ] Get Channel by ID - Perhaps use Elasticache or DAX
- [x] Client/ Server Error response segregation
- [x] Support GET (all & filter) APIs
- [ ] Support DELETE APIs
- [x] Client input validation (400 response)
- [x] Move CFN output names to common file
- [ ] Create IAM roles & policies for resources (this should elimiate dependency of stacks. Also try to replace with CFN Outputs)
- [ ] Create Cognito Groups with proper IAM permissions (eg: Admin - full access, user - limited R/ W access)
