# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## TODOS

- [ ] Integrate Cognito User pool
- [ ] Authorize APIs based on Cognito Roles (Cognito/ Lambda authorizers)
- [ ] Update some/ all lambdas to check access to channel for user from Cognito auth token
- [ ] Get Channel by ID - Perhaps use Elasticache or DAX
- [x] Client/ Server Error response segregation
- [x] Support GET (all & filter) APIs
- [ ] Support DELETE APIs
- [x] Client input validation (400 response)
