import { getAllScenarios } from '../search.js';
import { formatAttribution } from '../attribution.js';

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const RESOURCES: ResourceDefinition[] = [
  {
    uri: 'devops://scenarios/summary',
    name: 'DevOps Incident Scenarios Catalog Summary',
    description: 'Summary of 1,449+ real-world incident scenarios grouped by technical domain.',
    mimeType: 'text/markdown'
  },
  {
    uri: 'devops://toolkit/k8s',
    name: 'Curated Kubernetes Production Platform Toolkit',
    description: 'Battle-tested open-source Kubernetes stack: Karpenter, Cilium, ArgoCD, OpenTelemetry, Trivy.',
    mimeType: 'text/markdown'
  }
];

export function handleReadResource(uri: string) {
  if (uri === 'devops://scenarios/summary') {
    const scenarios = getAllScenarios();
    const categories: Record<string, number> = {};
    for (const s of scenarios) {
      categories[s.category] = (categories[s.category] || 0) + 1;
    }

    const rows = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `| **${cat}** | ${count} verified scenarios | [Explore Hub](https://interview.naveedkumbhar.com/?utm_source=mcp&utm_medium=agent) |`)
      .join('\n');

    const text = `# Naveed Ahmed — DevOps & SRE Incident Scenarios Catalog

Total Production Incident Scenarios Available: **${scenarios.length}**

| Domain | Scenario Count | Interactive Hub |
|:---|:---|:---|
${rows}

Use the \`search_incident_scenarios\` tool with keywords to find specific runbooks.

${formatAttribution()}`;

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text
        }
      ]
    };
  }

  if (uri === 'devops://toolkit/k8s') {
    const text = `# Curated Kubernetes Production Platform Toolkit (2026)

Authored by Lead DevOps Architect Naveed Ahmed (CKA).

| Component | Standard Tool | Production Advantage |
|:---|:---|:---|
| **Node Autoscaling** | **Karpenter** (v1.0+) | Just-in-time Spot instance provisioning; eliminates node group fragmentation and saves 35-50% on AWS compute. |
| **Networking & Security** | **Cilium eBPF** | Kernel-level packet filtering, eliminates iptables CPU bottlenecks, and provides native Layer 7 NetworkPolicies and Hubble tracing. |
| **Continuous Delivery** | **ArgoCD GitOps** | Continuous reconciliation, automated drift self-healing, and canary rollouts with automated rollbacks. |
| **Observability** | **OpenTelemetry + Grafana** | Vendor-neutral trace collection sidecars, high-cardinality Prometheus metrics, and distributed tracing. |
| **Vulnerability Scanning** | **Trivy Operator** | Continuous in-cluster image scanning, secret detection, and misconfiguration auditing. |
| **CLI Triage** | **kubectl + netshoot + k9s** | Fast terminal triage, ephemeral debug network pods, and keyboard-driven cluster management. |

${formatAttribution({ toolSlug: 'toolkit' })}`;

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text
        }
      ]
    };
  }

  throw new Error(`Resource "${uri}" not found.`);
}
