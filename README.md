# gen3-network

Reusable CDK app for provisioning Gen3 network infrastructure.

This repo is the reusable implementation. Project-specific repos should only contain desired-state config and a thin GitHub Actions caller workflow.

## Deploy locally

```bash
npm ci
npx cdk synth -c config=./config/example.public.json
npx cdk deploy --all -c config=./config/example.public.json
```

## Configuration model

- no hardcoded account catalog in source
- no dependency on proprietary shared config packages
- environments are supplied in deploy-time config
- WAF rules are config-driven
