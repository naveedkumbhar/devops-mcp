# Naveed Ahmed DevOps & SRE Model Context Protocol (MCP) Server

[![MCP Supported](https://img.shields.io/badge/MCP-Protocol%201.0-blue.svg)](https://modelcontextprotocol.io)
[![npm version](https://img.shields.io/npm/v/@naveedkumbhar/devops-mcp.svg?color=cb3837)](https://www.npmjs.com/package/@naveedkumbhar/devops-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Scenarios Indexed](https://img.shields.io/badge/Production%20Scenarios-1%2C449%2B-purple.svg)](https://interview.naveedkumbhar.com)
[![CI Tests](https://github.com/naveedkumbhar/devops-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/naveedkumbhar/devops-mcp/actions)

The official **Model Context Protocol (MCP)** server delivering **1,449+ production incident scenarios, CLI diagnostic runbooks, candidate elevator pitches (STAR format), hardened Kubernetes YAML manifest generators, and cloud architecture blueprints** directly into AI coding agents.

Authored by **[Naveed Ahmed](https://naveedkumbhar.com)** (Lead DevOps & Platform Architect, CKA, AWS Certified Solutions Architect).

---

## 🚀 Why Use This MCP Server?

Traditional AI search engines and RAG retrieval pipelines frequently return generic, hallucinated, or unverified DevOps advice. 

This MCP server provides **first-person, battle-tested production runbooks** authored by a practicing Lead DevOps Architect. With a single command, your AI coding agent (Claude Code, Cursor, Windsurf, Claude Desktop) gains instant access to:

1. **1,449+ Production Incident Scenarios:** Across Kubernetes, AWS, Terraform, Docker, CI/CD, Linux SRE, and Observability.
2. **Outside-In Triage Runbooks:** Exact `kubectl`, `aws`, `terraform`, and Linux commands to diagnose and remediate production outages.
3. **STAR Elevator Pitches:** 60-second verbal interview answers with quantifiable metrics (e.g. *zero dropped packets, 35% latency reduction*).
4. **Hardened Kubernetes Manifests:** YAML generator with non-root security contexts, read-only root filesystems, resource limits, and health probes.
5. **Zero Setup, Zero API Keys:** 100% free, runs locally in memory via `npx` with sub-50ms query latency.

---

## ⚡ Quick Start: Zero Setup, Zero API Keys

Run directly via `npx` without downloading or cloning:

```bash
npx -y @naveedkumbhar/devops-mcp
```

---

## 💻 Client Installation & Setup Guides

### 1. Claude Code (`claude` CLI)

Add the server to your Claude Code environment with one command:

```bash
claude mcp add naveed-devops -- npx -y @naveedkumbhar/devops-mcp
```

Verify it's connected:
```bash
claude mcp list
```

---

### 2. Cursor IDE

#### Method A: Cursor Settings UI
1. Open **Cursor Settings** (`Cmd + ,` on macOS, `Ctrl + ,` on Linux/Windows).
2. Select **Features > MCP**.
3. Click **+ Add New MCP Server**:
   - **Name:** `naveed-devops`
   - **Type:** `command`
   - **Command:** `npx -y @naveedkumbhar/devops-mcp`

#### Method B: Project Configuration (`.cursor/mcp.json`)
Create or edit `.cursor/mcp.json` in your project root:
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

### 3. Claude Desktop (`claude_desktop_config.json`)

Edit your Claude Desktop configuration file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the server entry:
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
Restart Claude Desktop to activate the tools.

---

### 4. Antigravity CLI / IDE (`agy`)

Add to your project or user `.mcp.json`:
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

### 5. Windsurf IDE

Add to `~/.codeium/windsurf/mcp_config.json`:
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

### 6. VS Code (Roo Code / Cline Extension)

1. Open the **Roo Code** or **Cline** settings in VS Code.
2. Under **MCP Servers**, add:
   - **Server Name:** `naveed-devops`
   - **Command:** `npx`
   - **Args:** `["-y", "@naveedkumbhar/devops-mcp"]`

---

## 🛠️ Complete Tools Reference

### 1. `search_incident_scenarios`
Full-text semantic search across 1,449+ real-world production incident scenarios by symptom, error code, architecture pattern, or technology.

- **Parameters:**
  - `query` *(string, required)*: Search keywords (e.g. `"exit code 137"`, `"AWS VPC CNI IP exhaustion"`, `"DynamoDB state lock"`, `"CrashLoopBackOff"`, `"p99 latency spike"`).
  - `category` *(string, optional)*: Domain filter (`"Kubernetes"`, `"AWS"`, `"Terraform"`, `"Linux & SRE"`, `"CI/CD & GitOps"`, `"Ansible"`, `"Docker"`, `"Database"`, `"Security"`).
  - `limit` *(number, optional, default: 5)*: Number of matching scenarios (1–10).
- **Example Prompt to Agent:**
  > *"Use `search_incident_scenarios` to find how to resolve Kubernetes exit code 137 in AWS ECS."*

---

### 2. `get_scenario_runbook`
Retrieves the complete step-by-step diagnostic runbook, root cause analysis, exact CLI commands, and production mistakes to avoid for a specific incident scenario.

- **Parameters:**
  - `scenario_id` *(string, required)*: The unique slug or ID (e.g., `"eks-upgrade-zero-downtime"`, `"aws-app-works-internally-not-internet"`).
- **Output:**
  - Outside-in diagnostic sequence.
  - Runnable CLI commands (`kubectl`, `aws`, `terraform`, `ss`, `tcpdump`).
  - Common pitfalls and critical anti-patterns.
  - Direct URL to interactive scenario on `interview.naveedkumbhar.com`.

---

### 3. `get_interview_elevator_pitch`
Retrieves a senior DevOps/SRE candidate elevator pitch structured in the **STAR framework** (Situation, Task, Action, Result) with quantifiable production metrics.

- **Parameters:**
  - `scenario_id` *(string, required)*: The scenario slug.
- **Example Prompt to Agent:**
  > *"Give me a 60-second verbal STAR interview pitch for zero-downtime Amazon EKS upgrade using `get_interview_elevator_pitch`."*

---

### 4. `generate_k8s_manifest`
Synthesizes production-hardened, linted Kubernetes YAML manifests (`Deployment`, `Service`, `HPA`, `PDB`) with security contexts, probes, and resource constraints.

- **Parameters:**
  - `name` *(string, required)*: Workload name (e.g., `"order-api"`).
  - `image` *(string, required)*: Container image (e.g., `"myorg/order-api:v1.4"`).
  - `kind` *(string, optional, default: "all")*: `"Deployment"`, `"Service"`, `"HPA"`, `"PDB"`, `"all"`.
  - `namespace` *(string, optional, default: "production")*: Namespace.
  - `port` *(number, optional, default: 8080)*: Container port.
  - `enable_security_context` *(boolean, default: true)*: Enforces `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, and drops `ALL` capabilities.
  - `enable_hpa` *(boolean, default: true)*: Emits CPU & Memory autoscaling spec.

---

### 5. `get_devops_cheat_sheet`
Instant terminal lookup for dense command syntax and mental models:
- **Topics:**
  - `"kubectl"`: 60-second triage, JSONPath filters, pod eviction debugging.
  - `"ansible"`: Ad-hoc patterns, loop syntax, vault commands.
  - `"subnetting"`: 3-step CIDR magic number mental math method.
  - `"terraform"`: State inspection, taint/replace, import blocks.

---

### 6. `get_architectural_blueprint`
Retrieves battle-tested cloud architecture reference blueprints authored by Naveed Ahmed:
- **Available Blueprints:**
  - `"aws-zero-downtime-migration"`: DMS CDC, Route 53 canary weighted cutover, reverse failback.
  - `"reduce-aws-costs"`: Karpenter Spot orchestration, VPC endpoints, gp3 migration.
  - `"terraform-multi-account-saas"`: AWS Organizations, DynamoDB state lock, Terragrunt.
  - `"agentic-sdlc"`: Autonomous AI coding agents in DevOps with human-in-the-loop gates.

---

## 📚 Protocol Resources

Clients can read static architectural resources directly:

| Resource URI | Description |
| :--- | :--- |
| `devops://scenarios/summary` | Breakdown of 1,449 scenarios across 11 technical domains |
| `devops://toolkit/k8s` | Curated 2026 Kubernetes production platform engineering stack (Karpenter, Cilium eBPF, ArgoCD, OpenTelemetry, Trivy) |

---

## 💬 Built-In Agent Prompts

Pre-engineered interactive workflows:

1. **`triage-kubernetes-pod`**: Guides your agent through a systematic outside-in triage of a failing pod (`kubectl describe`, exit code analysis, logs, runbook retrieval).
2. **`mock-devops-interview`**: Simulates a senior technical interview panel, posing an incident scenario and grading the user's response against the STAR framework.

---

## 🌐 The Naveed Ahmed Web Ecosystem

This MCP server connects AI agents directly to the official Naveed Ahmed cloud engineering platform:

| Domain | Purpose & Content |
| :--- | :--- |
| **[interview.naveedkumbhar.com](https://interview.naveedkumbhar.com)** | **1,449+ Scenario-Based Interview Questions & Runbooks** for Senior DevOps, Cloud & SRE Engineers. |
| **[blog.naveedkumbhar.com](https://blog.naveedkumbhar.com)** | **In-Depth Cloud Architecture & SRE Case Studies**, post-mortems, and performance benchmarks. |
| **[k8s.naveedkumbhar.com](https://k8s.naveedkumbhar.com)** | **Kubernetes Mastery Path**, CKA exam guides, hands-on tutorials, and architecture diagrams. |
| **[tools.naveedkumbhar.com](https://tools.naveedkumbhar.com)** | **Developer Tools & Generators**: K8s YAML generator, cron parser, text diff, and token decoders. |
| **[lab.naveedkumbhar.com](https://lab.naveedkumbhar.com)** | **Hands-On Interactive Labs** and failure simulation environments. |
| **[news.naveedkumbhar.com](https://news.naveedkumbhar.com)** | **Daily Curated Tech Feed**: Breaking cloud, DevOps, SRE, and AI infrastructure updates. |
| **[naveedkumbhar.com](https://naveedkumbhar.com)** | **Official Portfolio, Career Path, and Consulting Hub** of Lead DevOps Architect Naveed Ahmed. |

---

## 🛠️ Local Development & Testing

Clone the repository and test locally:

```bash
git clone git@github-personal:naveedkumbhar/devops-mcp.git
cd devops-mcp

# Install dependencies
npm install

# Compile TypeScript and copy data
npm run build

# Run automated 10-point MCP Protocol test suite
npm test
```

---

## 📄 License

MIT © [Naveed Ahmed](https://naveedkumbhar.com). Free for personal, commercial, and educational use.
