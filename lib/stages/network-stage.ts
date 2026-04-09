import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { BaseNamingProps, ResolvedStageConfig } from "../types";
import { NetworkStack } from "../stacks/network-stack";
import { WafStack } from "../stacks/waf-stack";

export interface NetworkStageProps extends cdk.StageProps, BaseNamingProps {
  resolved: ResolvedStageConfig;
}

export class NetworkStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: NetworkStageProps) {
    super(scope, id, props);

    new NetworkStack(this, "Network", {
      env: { account: props.resolved.envTarget.account, region: props.resolved.envTarget.region },
      project: props.project,
      application: props.application,
      namePrefix: props.namePrefix,
      ssmPrefix: props.ssmPrefix,
      secretPrefix: props.secretPrefix,
      envTarget: props.resolved.envTarget,
      network: props.resolved.network,
    });

    if (props.resolved.waf.enabled && props.resolved.waf.webAclProps) {
      new WafStack(this, "Waf", {
        env: { account: props.resolved.envTarget.account, region: props.resolved.envTarget.region },
        project: props.project,
        application: props.application,
        namePrefix: props.namePrefix,
        ssmPrefix: props.ssmPrefix,
        secretPrefix: props.secretPrefix,
        envTarget: props.resolved.envTarget,
        webAclProps: props.resolved.waf.webAclProps,
        logPolicy: props.resolved.waf.logPolicy,
      });
    }
  }
}
