import * as cdk from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { WafConfig } from "../types";
import { buildManagedRule } from "./managed-rules";

export function resolveRemovalPolicy(value?: string): cdk.RemovalPolicy {
  switch ((value ?? "RETAIN").toUpperCase()) {
    case "DESTROY": return cdk.RemovalPolicy.DESTROY;
    case "SNAPSHOT": return cdk.RemovalPolicy.SNAPSHOT;
    default: return cdk.RemovalPolicy.RETAIN;
  }
}

export function buildWebAclProps(project: string, application: string, envName: string, waf: WafConfig): wafv2.CfnWebACLProps {
  return {
    defaultAction: { allow: {} },
    scope: "REGIONAL",
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      sampledRequestsEnabled: true,
      metricName: `${project}-${application}-${envName}`,
    },
    rules: waf.managedRuleSets.slice().sort((a,b) => a.priority - b.priority).map(buildManagedRule),
  };
}
