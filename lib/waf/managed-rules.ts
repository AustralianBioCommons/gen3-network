import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { ManagedRuleSetConfig } from "../types";

export function buildManagedRule(
  config: ManagedRuleSetConfig
): wafv2.CfnWebACL.RuleProperty {
  const managedRuleGroupStatement: wafv2.CfnWebACL.ManagedRuleGroupStatementProperty = {
    vendorName: config.vendorName,
    name: config.name,
    ...(config.version ? { version: config.version } : {}),
    ...(config.excludedRules && config.excludedRules.length > 0
      ? {
        excludedRules: config.excludedRules.map((name) => ({ name })),
      }
      : {}),
    ...(config.name === "AWSManagedRulesBotControlRuleSet" && config.inspectionLevel
      ? {
        managedRuleGroupConfigs: [
          {
            awsManagedRulesBotControlRuleSet: {
              inspectionLevel: config.inspectionLevel,
            },
          },
        ],
      }
      : {}),
  };

  return {
    name: config.name,
    priority: config.priority,
    overrideAction: { none: {} },
    statement: {
      managedRuleGroupStatement,
    },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      sampledRequestsEnabled: true,
      metricName: config.name,
    },
  };
}