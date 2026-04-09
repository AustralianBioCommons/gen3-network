import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { ManagedRuleSetConfig } from "../types";

export function buildManagedRule(config: ManagedRuleSetConfig): wafv2.CfnWebACL.RuleProperty {
  const statement: wafv2.CfnWebACL.ManagedRuleGroupStatementProperty = {
    vendorName: config.vendorName,
    name: config.name,
  };

  if (config.version) statement.version = config.version;
  if (config.excludedRules?.length) {
    statement.excludedRules = config.excludedRules.map((name) => ({ name }));
  }
  if (config.name === "AWSManagedRulesBotControlRuleSet" && config.inspectionLevel) {
    statement.managedRuleGroupConfigs = [{
      awsManagedRulesBotControlRuleSet: { inspectionLevel: config.inspectionLevel },
    }];
  }

  return {
    name: config.name,
    priority: config.priority,
    overrideAction: { none: {} },
    statement: { managedRuleGroupStatement: statement },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      sampledRequestsEnabled: true,
      metricName: config.name,
    },
  };
}
