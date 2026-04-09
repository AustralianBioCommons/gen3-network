import * as cdk from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";

export interface EnvironmentTarget {
  name: string;
  account: string;
  region: string;
}

export interface AppConfig {
  project: string;
  application: string;
  owner?: string;
  tags?: Record<string, string>;
  naming: NamingConfig;
  environments: Record<string, EnvironmentTarget>;
  stages: StageConfig[];
}

export interface NamingConfig {
  namePrefix: string;
  ssmPrefix: string;
  secretPrefix: string;
}

export interface StageConfig {
  id: string;
  stageName: string;
  envKey: string;
  network: NetworkConfig;
  waf: WafConfig;
  approvals?: ApprovalConfig;
}

export interface NetworkConfig {
  vpcCidr: string;
  subnetCidr: number;
  natGateways: number;
  maxAzs?: number;
  enableS3GatewayEndpoint?: boolean;
  interfaceEndpoints?: InterfaceEndpointName[];
}

export type InterfaceEndpointName = "S3" | "EKS" | "PROMETHEUS_WORKSPACES";

export interface WafConfig {
  enabled: boolean;
  managedRuleSets: ManagedRuleSetConfig[];
  logRetentionPolicy?: "DESTROY" | "RETAIN" | "SNAPSHOT";
}

export interface ManagedRuleSetConfig {
  vendorName: "AWS";
  name:
    | "AWSManagedRulesCommonRuleSet"
    | "AWSManagedRulesAmazonIpReputationList"
    | "AWSManagedRulesKnownBadInputsRuleSet"
    | "AWSManagedRulesLinuxRuleSet"
    | "AWSManagedRulesUnixRuleSet"
    | "AWSManagedRulesAnonymousIpList"
    | "AWSManagedRulesBotControlRuleSet";
  priority: number;
  version?: string;
  excludedRules?: string[];
  inspectionLevel?: "COMMON" | "TARGETED";
}

export interface ApprovalConfig {
  requireManualApproval?: boolean;
}

export interface ResolvedStageConfig {
  id: string;
  stageName: string;
  envTarget: EnvironmentTarget;
  network: Required<NetworkConfig>;
  waf: {
    enabled: boolean;
    webAclProps?: wafv2.CfnWebACLProps;
    logPolicy: cdk.RemovalPolicy;
  };
  requireManualApproval: boolean;
}

export interface BaseNamingProps {
  project: string;
  application: string;
  namePrefix: string;
  ssmPrefix: string;
  secretPrefix: string;
}

export interface NetworkStackProps extends cdk.StackProps, BaseNamingProps {
  envTarget: EnvironmentTarget;
  network: Required<NetworkConfig>;
}

export interface WafStackProps extends cdk.StackProps, BaseNamingProps {
  envTarget: EnvironmentTarget;
  webAclProps: wafv2.CfnWebACLProps;
  logPolicy: cdk.RemovalPolicy;
}
