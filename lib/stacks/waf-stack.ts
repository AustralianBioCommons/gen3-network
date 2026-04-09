import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { WafStackProps } from "../types";

export class WafStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);
    const envName = props.envTarget.name;
    const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
      ...props.webAclProps,
      name: `${props.namePrefix}-${envName}-web-acl`,
      scope: "REGIONAL",
    });
    const logGroup = new logs.LogGroup(this, "WafLogGroup", {
      logGroupName: `aws-waf-logs-${props.project}-${props.application}-${envName}`,
      removalPolicy: props.logPolicy,
    });
    new wafv2.CfnLoggingConfiguration(this, "WafLoggingConfiguration", {
      resourceArn: webAcl.attrArn,
      logDestinationConfigs: [
        `arn:aws:logs:${props.envTarget.region}:${props.envTarget.account}:log-group:${logGroup.logGroupName}`,
      ],
    });
    new ssm.StringParameter(this, "WafAclArnParameter", {
      parameterName: `${props.ssmPrefix}/${props.project}/${props.application}/${envName}/waf-acl-arn`,
      stringValue: webAcl.attrArn,
    });
  }
}
