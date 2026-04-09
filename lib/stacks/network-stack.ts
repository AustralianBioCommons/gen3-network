import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { NetworkStackProps } from "../types";

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);
    const envName = props.envTarget.name;
    const qualifiedName = `${props.namePrefix}-${envName}`;

    this.vpc = new ec2.Vpc(this, "Vpc", {
      vpcName: qualifiedName,
      ipAddresses: ec2.IpAddresses.cidr(props.network.vpcCidr),
      natGateways: props.network.natGateways,
      maxAzs: props.network.maxAzs,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        { name: "public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: props.network.subnetCidr },
        { name: "private", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: props.network.subnetCidr },
        { name: "isolated", subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: props.network.subnetCidr },
      ],
    });

    if (props.network.enableS3GatewayEndpoint) {
      this.vpc.addGatewayEndpoint("S3GatewayEndpoint", { service: ec2.GatewayVpcEndpointAwsService.S3 });
    }

    const endpointSg = new ec2.SecurityGroup(this, "EndpointSecurityGroup", {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: "Security group for interface endpoints",
    });
    endpointSg.addIngressRule(ec2.Peer.ipv4(props.network.vpcCidr), ec2.Port.tcp(443), "Allow HTTPS from within VPC");

    const endpointServices: Record<string, ec2.InterfaceVpcEndpointAwsService> = {
      S3: ec2.InterfaceVpcEndpointAwsService.S3,
      EKS: ec2.InterfaceVpcEndpointAwsService.EKS,
      PROMETHEUS_WORKSPACES: ec2.InterfaceVpcEndpointAwsService.PROMETHEUS_WORKSPACES,
    };

    for (const endpointName of props.network.interfaceEndpoints) {
      new ec2.InterfaceVpcEndpoint(this, `${endpointName}Endpoint`, {
        vpc: this.vpc,
        service: endpointServices[endpointName],
        securityGroups: [endpointSg],
      });
    }

    for (const subnet of this.vpc.privateSubnets) cdk.Tags.of(subnet).add("kubernetes.io/role/internal-elb", "1");
    for (const subnet of this.vpc.publicSubnets) cdk.Tags.of(subnet).add("kubernetes.io/role/elb", "1");

    const privateSubnetIds = this.vpc.privateSubnets.map((s) => s.subnetId).join(",");
    new ssm.StringParameter(this, "VpcIdParameter", {
      parameterName: `${props.ssmPrefix}/${props.project}/${props.application}/${envName}/vpc-id`,
      stringValue: this.vpc.vpcId,
    });
    new ssm.StringParameter(this, "PrivateSubnetIdsParameter", {
      parameterName: `${props.ssmPrefix}/${props.project}/${props.application}/${envName}/private-subnet-ids`,
      stringValue: privateSubnetIds,
    });
    new secretsmanager.Secret(this, "VpcIdSecret", {
      secretName: `${props.secretPrefix}/${props.project}/${props.application}/${envName}/vpc-id`,
      secretStringValue: cdk.SecretValue.unsafePlainText(this.vpc.vpcId),
    });
  }
}
