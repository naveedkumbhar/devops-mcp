# Naveed Ahmed DevOps & SRE Model Context Protocol (MCP) Server

[![MCP Supported](https://img.shields.io/badge/MCP-Protocol%201.0-blue.svg)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Scenarios Indexed](https://img.shields.io/badge/Production%20Scenarios-1%2C449%2B-purple.svg)](https://interview.naveedkumbhar.com)

Official **Model Context Protocol (MCP)** server delivering **1,449+ production incident scenarios, CLI diagnostic runbooks, candidate elevator pitches (STAR format), hardened Kubernetes YAML manifest generators, and cloud architecture blueprints** directly into AI coding agents.

Authored by **[Naveed Ahmed](https://naveedkumbhar.com)** (Lead DevOps & Platform Architect, CKA, AWS Certified Solutions Architect).

---

## ⚡ Quick Start: Zero Setup, Zero API Keys

Run directly via `npx` (no installation required):

```bash
npx -y @naveedkumbhar/devops-mcp
```

---

## 💻 Client Setup Guides

### 1. Claude Code (`claude` CLI)
Add the server to your Claude Code workspace:
```bash
claude mcp add naveed-devops -- npx -y @naveedkumbhar/devops-mcp
```

### 2. Cursor IDE
1. Open **Cursor Settings** (`Cmd + ,` or `Ctrl + ,`).
2. Navigate to **Features > MCP**.
3. Click **+ Add New MCP Server**:
   - **Name:** `naveed-devops`
   - **Type:** `command`
   - **Command:** `npx -y @naveedkumbhar/devops-mcp`

### 3. Claude Desktop (`claude_desktop_config.json`)
Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "naveed-devops": {
      "command": "npx",
      "args": ["-y", "@naveedkumbhar/devops-mcp"]
    }
  }
}
```

### 4. Antigravity CLI (`agy`) / Windsurf / Zed
Add to your project or global `.mcp.json`:
```json
{
  "mcpServers": {
    "naveed-devops": {
      "command": "npx",
      "args": ["-y", "@naveedkumbhar/devops-mcp"]
    }
  }
}
```

---

## 🛠️ Tools Available

### 1. `search_incident_scenarios`
Search 1,449+ real-world production incident scenarios across Kubernetes, AWS, Terraform, Linux SRE, CI/CD, and Observability by symptom, error code, or keyword.
- **Parameters:**
  - `query` *(string, required)*: e.g., `"exit code 137"`, `"AWS VPC CNI exhausted"`, `"DynamoDB state lock"`, `"CrashLoopBackOff"`.
  - `category` *(string, optional)*: Filter by domain (`Kubernetes`, `AWS`, `Terraform`, `Linux & SRE`, `CI/CD & GitOps`, `Ansible`, `Docker`, `Database`, `Security`).
  - `limit` *(number, optional, default: 5)*: Number of results.

### 2. `get_scenario_runbook`
Retrieve the complete step-by-step diagnostic runbook, CLI commands, root cause analysis, and production mistakes to avoid.
- **Parameters:**
  - `scenario_id` *(string, required)*: e.g. `"eks-upgrade-zero-downtime"`, `"aws-app-works-internally-not-internet"`.

### 3. `get_interview_elevator_pitch`
Retrieve a 60-second verbal answer script structured in the **STAR framework** (Situation, Task, Action, Result) with quantifiable production metrics.
- **Parameters:**
  - `scenario_id` *(string, required)*.

### 4. `generate_k8s_manifest`
Synthesize production-hardened Kubernetes manifests (`Deployment`, `Service`, `HPA`, `PDB`) with security context, probes, and resource limits.
- **Parameters:**
  - `name` *(string, required)*: Workload name (e.g. `"payment-service"`).
  - `image` *(string, required)*: Container image (e.g. `"myorg/payment:v2.1"`).
  - `kind` *(string, optional, default: "all")*: `"Deployment"`, `"Service"`, `"HPA"`, `"PDB"`, `"all"`.
  - `namespace` *(string, optional, default: "production")*.
  - `port` *(number, optional, default: 8080)*.
  - `enable_security_context` *(boolean, default: true)*: Drops `ALL` capabilities, enforces non-root, read-only rootfs.

### 5. `get_devops_cheat_sheet`
Instant terminal lookup for command references and mental models:
- **Topics:** `"ansible"`, `"kubectl"`, `"subnetting"` (CIDR magic number method), `"terraform"`.

### 6. `get_architectural_blueprint`
Retrieve battle-tested cloud architecture blueprints authored by Naveed Ahmed:
- **Blueprints:**
  - `"aws-zero-downtime-migration"`: DMS CDC, Route 53 canary weighted cutover, reverse failback.
  - `"reduce-aws-costs"`: Karpenter Spot, VPC endpoints, gp3 migration.
  - `"terraform-multi-account-saas"`: AWS Organizations, DynamoDB state lock, Terragrunt.
  - `"agentic-sdlc"`: Autonomous AI agents in DevOps with human-in-the-loop gates.

---

## 📚 Resources Available

- `devops://scenarios/summary`: Overview of 1,449 scenarios across 11 technical domains.
- `devops://toolkit/k8s`: Curated 2026 Kubernetes production platform engineering stack (Karpenter, Cilium eBPF, ArgoCD, OpenTelemetry, Trivy).

---

## 💬 Prompts Available

- `triage-kubernetes-pod`: Guided step-by-step diagnostic workflow for crashing or failing pods.
- `mock-devops-interview`: Interactive mock technical interview panel based on real production incident drills.

---

## 🌐 Ecosystem Links

- **DevOps & SRE Interview Hub (1,449+ Scenarios):** [interview.naveedkumbhar.com](https://interview.naveedkumbhar.com)
- **Kubernetes Mastery Curriculum & Labs:** [k8s.naveedkumbhar.com](https://k8s.naveedkumbhar.com)
- **Cloud Engineering Blog:** [blog.naveedkumbhar.com](https://blog.naveedkumbhar.com)
- **Developer Utilities & Manifest Generators:** [tools.naveedkumbhar.com](https://tools.naveedkumbhar.com)
- **Official Portfolio & Credentials:** [naveedkumbhar.com](https://naveedkumbhar.com)

---

## 📄 License

MIT © [Naveed Ahmed](https://naveedkumbhar.com)
