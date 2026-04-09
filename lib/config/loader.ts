import * as fs from "fs";
import * as path from "path";
import { AppConfig, EnvironmentTarget, ResolvedStageConfig, StageConfig } from "../types";
import { validateConfig } from "./schema";
import { buildWebAclProps, resolveRemovalPolicy } from "../waf/builder";

export function loadAppConfig(configPath: string): AppConfig {
  const absolutePath = path.resolve(configPath);
  const config = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as AppConfig;
  validateConfig(config);
  return config;
}

function resolveEnvironmentTarget(environments: Record<string, EnvironmentTarget>, envKey: string): EnvironmentTarget {
  const resolved = environments[envKey];
  if (!resolved) throw new Error(`Unknown envKey: ${envKey}`);
  return resolved;
}

export function resolveStageConfig(appConfig: AppConfig, stage: StageConfig): ResolvedStageConfig {
  const envTarget = resolveEnvironmentTarget(appConfig.environments, stage.envKey);
  const envName = envTarget.name;
  return {
    id: stage.id,
    stageName: stage.stageName,
    envTarget,
    network: {
      vpcCidr: stage.network.vpcCidr,
      subnetCidr: stage.network.subnetCidr,
      natGateways: stage.network.natGateways,
      maxAzs: stage.network.maxAzs ?? 3,
      enableS3GatewayEndpoint: stage.network.enableS3GatewayEndpoint ?? true,
      interfaceEndpoints: stage.network.interfaceEndpoints ?? ["S3", "EKS", "PROMETHEUS_WORKSPACES"],
    },
    waf: {
      enabled: stage.waf.enabled,
      webAclProps: stage.waf.enabled ? buildWebAclProps(appConfig.project, appConfig.application, envName, stage.waf) : undefined,
      logPolicy: resolveRemovalPolicy(stage.waf.logRetentionPolicy),
    },
    requireManualApproval: stage.approvals?.requireManualApproval ?? false,
  };
}
