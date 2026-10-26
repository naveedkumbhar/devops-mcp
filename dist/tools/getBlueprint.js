import { formatAttribution } from '../attribution.js';
export const BLUEPRINTS = {
    'aws-zero-downtime-migration': {
        id: 'aws-zero-downtime-migration',
        title: 'AWS Zero-Downtime Migration: Cutover and Rollback Blueprint',
        blogSlug: 'how-i-plan-zero-downtime-aws-migration',
        summary: 'Battle-tested migration architecture using AWS DMS CDC replication, Route 53 weighted canary DNS, and reverse-replication failback safeguards.',
        architecture: `# AWS Zero-Downtime Migration Blueprint

## Phase 1: Network & Security Foundations
- Establish AWS Direct Connect or Site-to-Site IPSec VPN with dual tunnels.
- Route tables and security groups configured with non-overlapping RFC 1918 CIDRs.
- End-to-end MTU validation (1420 MSS clamping to prevent TCP fragmentation).

## Phase 2: Continuous Data Replication (CDC)
- Deploy AWS Database Migration Service (AWS DMS) on multi-AZ replication instances.
- Enable ongoing Continuous Data Capture (CDC) alongside initial bulk full load.
- Validate CDC latency: target \`< 100ms\` replication lag before proceeding.

## Phase 3: Shadow Traffic & Dark Launch Validation
- Replay production HTTP ingress using Envoy shadow mirrors or AWS VPC Traffic Mirroring to the new AWS cluster.
- Monitor response parity: verify HTTP 200 rates, query execution times, and log error signatures.

## Phase 4: Canary Weighted DNS Cutover (Route 53)
- Lower DNS TTL on target records to **60 seconds** 48 hours prior to maintenance.
- Step 1: 5% traffic to AWS ALB -> monitor CloudWatch 5xx errors for 15 minutes.
- Step 2: 25% traffic -> check database connection pools and replication lag.
- Step 3: 50% traffic -> verify cache hit rates on Redis / ElastiCache.
- Step 4: 100% full cutover.

## Phase 5: Reverse Replication Rollback Safeguard
- Immediately initiate reverse CDC from AWS Aurora/RDS back to legacy database.
- If an unrecoverable failure occurs within 4 hours, Route 53 swings 100% traffic back to legacy with zero lost writes.
`
    },
    'reduce-aws-costs': {
        id: 'reduce-aws-costs',
        title: 'Production AWS Cost Reduction Framework (Without Breaking Reliability)',
        blogSlug: 'how-to-reduce-aws-costs-without-breaking-production',
        summary: 'Cutting 30-45% of cloud expenditure using Karpenter Spot orchestration, VPC Gateway Endpoints, gp3 storage upgrades, and S3 lifecycle tiering.',
        architecture: `# Production AWS Cost Reduction Framework

## 1. Compute: Karpenter Just-In-Time Spot Provisioning
- Swap legacy Cluster Autoscaler for Karpenter v1.0+.
- Run stateless workloads on Spot instances with diversified instance types (\`instance-category: ["c", "m", "r"]\`).
- Karpenter NodePool configuration:
  \`\`\`yaml
  requirements:
  - key: "karpenter.sh/capacity-type"
    operator: In
    values: ["spot", "on-demand"]
  - key: "karpenter.k8s.aws/instance-category"
    operator: In
    values: ["c", "m"]
  \`\`\`
- Result: 60-70% savings on worker node compute costs with automated disruption handling.

## 2. Networking: Eliminate Costly NAT Gateway Data Processing
- AWS NAT Gateways charge **$0.045/GB** for data processing.
- Create AWS VPC **Gateway Endpoints** for S3 and DynamoDB (100% free of charge).
- Route all container image pulls (ECR) and state downloads away from NAT gateways directly into AWS internal routing.

## 3. Storage: EBS gp2 to gp3 Automated In-Place Migration
- gp2 baseline performance is tied to disk size (3 IOPS/GB) requiring overprovisioning.
- gp3 provides baseline 3,000 IOPS and 125 MB/s throughput regardless of size, at **20% lower storage cost**.
- Migrate in-place without volume unmounting using AWS CLI or Terraform.

## 4. S3 Storage Lens & Intelligent Tiering
- Transition objects older than 30 days to S3 Standard-IA or Intelligent-Tiering.
- Expire aborted multipart uploads after 7 days (hidden cost trap).
`
    },
    'terraform-multi-account-saas': {
        id: 'terraform-multi-account-saas',
        title: 'Terraform AWS Multi-Account SaaS Blueprint',
        blogSlug: 'terraform-architecture-production-aws-saas',
        summary: 'Production-ready Infrastructure as Code layout with AWS Organizations, DynamoDB state locking, Terragrunt DRY modules, and CI drift guardrails.',
        architecture: `# Terraform AWS Multi-Account SaaS Blueprint

## Account Separation Hierarchy
\`\`\`text
Root Organization Account
├── Core Services (Identity Center / SSO, Central Billing)
├── Security Tooling (GuardDuty, SecurityHub, CloudTrail)
├── Shared Networking (Transit Gateway, Direct Connect)
└── Workloads
    ├── Non-Production (Dev / Sandbox)
    ├── Staging (Exact replica of Prod topology)
    └── Production (Isolated VPC, strict IAM boundary)
\`\`\`

## Remote State Locking Architecture
\`\`\`hcl
terraform {
  backend "s3" {
    bucket         = "saas-production-terraform-state"
    key            = "workloads/eks/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
\`\`\`

## CI Drift Detection & Guardrails
- Scheduled hourly \`terraform plan -detailed-exitcode\` via GitHub Actions.
- Exit code 2 indicates drift -> alerts Slack channel with affected resources.
- Conftest / Open Policy Agent (OPA) gate blocks plans introducing 0.0.0.0/0 ingress on non-web ports.
`
    },
    'agentic-sdlc': {
        id: 'agentic-sdlc',
        title: 'Agentic SDLC: Autonomous AI Agents in Production DevOps',
        blogSlug: 'agentic-sdlc-explained',
        summary: 'Architectural model for integrating autonomous AI agents (MCP, Claude Code, Cursor) into continuous integration, deployment, and incident triage with human approval gates.',
        architecture: `# Agentic SDLC & DevOps AI Architecture

## 3-Tier Autonomous Agent Governance
1. **Tier 1 (Read & Diagnose):** Fully autonomous. Agent inspects logs, describes pods, parses traces, and matches historical incident post-mortems.
2. **Tier 2 (Staging & Ephemeral Fixes):** Semi-autonomous. Agent creates PRs, runs Terraform plans, and deploys to isolated ephemeral environments.
3. **Tier 3 (Production Execution):** Human-in-the-Loop required. Agent generates the exact runbook command and rollback plan, pausing for senior SRE approval before execution.

## Model Context Protocol (MCP) Integration
- Standardize tool calling through MCP servers like \`@naveedkumbhar/devops-mcp\`.
- All agent actions leave signed audit trails in centralized telemetry (OpenTelemetry / Loki).
`
    }
};
export function handleGetBlueprint(args) {
    const key = (args.blueprint || '').toLowerCase().trim();
    if (!key) {
        const available = Object.keys(BLUEPRINTS).join(', ');
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: blueprint name is required. Available blueprints: ${available}`
                }
            ],
            isError: true
        };
    }
    const bp = BLUEPRINTS[key];
    if (!bp) {
        const available = Object.keys(BLUEPRINTS).join(', ');
        return {
            content: [
                {
                    type: 'text',
                    text: `Blueprint "${key}" not found. Available blueprints: ${available}`
                }
            ],
            isError: true
        };
    }
    const text = `${bp.architecture}
${formatAttribution({ blogSlug: bp.blogSlug })}`;
    return {
        content: [
            {
                type: 'text',
                text
            }
        ]
    };
}
