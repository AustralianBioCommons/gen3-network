#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { loadAppConfig, resolveStageConfig } from "../lib/config/loader";
import { NetworkStack } from "../lib/stacks/network-stack";
import { WafStack } from "../lib/stacks/waf-stack";

const app = new cdk.App();

const configPath = app.node.tryGetContext("config");
if (!configPath) {
  throw new Error("Missing CDK context key: config");
}

const config = loadAppConfig(configPath);

cdk.Tags.of(app).add("Project", config.project);
cdk.Tags.of(app).add("Application", config.application);

if (config.owner) {
  cdk.Tags.of(app).add("Owner", config.owner);
}

for (const [key, value] of Object.entries(config.tags ?? {})) {
  cdk.Tags.of(app).add(key, value);
}

for (const stageConfig of config.stages) {
  const resolved = resolveStageConfig(config, stageConfig);

  const env = {
    account: resolved.envTarget.account,
    region: resolved.envTarget.region,
  };

  const network = new NetworkStack(app, `${stageConfig.id}Network`, {
    env,
    project: config.project,
    application: config.application,
    namePrefix: config.naming.namePrefix,
    ssmPrefix: config.naming.ssmPrefix,
    secretPrefix: config.naming.secretPrefix,
    envTarget: resolved.envTarget,
    network: resolved.network,
  });

  cdk.Tags.of(network).add("Project", config.project);
  cdk.Tags.of(network).add("Application", config.application);
  cdk.Tags.of(network).add("Environment", resolved.envTarget.name);

  if (resolved.waf.enabled && resolved.waf.webAclProps) {
    const waf = new WafStack(app, `${stageConfig.id}Waf`, {
      env,
      project: config.project,
      application: config.application,
      namePrefix: config.naming.namePrefix,
      ssmPrefix: config.naming.ssmPrefix,
      secretPrefix: config.naming.secretPrefix,
      envTarget: resolved.envTarget,
      webAclProps: resolved.waf.webAclProps,
      logPolicy: resolved.waf.logPolicy,
    });

    cdk.Tags.of(waf).add("Project", config.project);
    cdk.Tags.of(waf).add("Application", config.application);
    cdk.Tags.of(waf).add("Environment", resolved.envTarget.name);
  }
}