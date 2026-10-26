#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { readFileSync } from 'fs';
import { initSearchIndex } from './search.js';
import { handleSearchScenarios } from './tools/searchScenarios.js';
import { handleGetRunbook } from './tools/getRunbook.js';
import { handleGetElevatorPitch } from './tools/getElevatorPitch.js';
import { handleGenerateK8sYaml } from './tools/generateK8sYaml.js';
import { handleGetCheatsheet } from './tools/getCheatsheet.js';
import { handleGetBlueprint } from './tools/getBlueprint.js';
import { handleDecodeError } from './tools/decodeError.js';
import { RESOURCES, handleReadResource } from './resources/index.js';
import { PROMPTS, handleGetPrompt } from './prompts/index.js';

// Initialize in-memory search index
const { total } = initSearchIndex();
process.stderr.write(`[devops-mcp] Initialized in-memory index with ${total} production scenarios.\n`);

const pkgVersion: string = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')).version;

const server = new Server(
  {
    name: 'naveedkumbhar/devops-mcp',
    version: pkgVersion
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. TOOLS REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_incident_scenarios',
        description: 'Search 1,449+ real-world production incident scenarios across Kubernetes, AWS, Terraform, Linux, SRE, and CI/CD by symptoms, error codes (e.g. 137, 143, 502), or keywords.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The symptom, exit code, error message, or technology (e.g., "exit code 137", "AWS VPC CNI exhausted", "DynamoDB state lock", "OOMKilled")'
            },
            category: {
              type: 'string',
              description: 'Optional filter by domain: "Kubernetes", "AWS", "Terraform", "Linux & SRE", "CI/CD & GitOps", "Ansible", "Docker", "Database", "Security"'
            },
            limit: {
              type: 'number',
              description: 'Number of results to return (default: 5, max: 20)'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_scenario_runbook',
        description: 'Retrieve the complete step-by-step diagnostic runbook, CLI commands, root cause analysis, and production mistakes to avoid for a specific incident scenario ID or slug.',
        inputSchema: {
          type: 'object',
          properties: {
            scenario_id: {
              type: 'string',
              description: 'The unique scenario slug or ID (e.g., "eks-upgrade-zero-downtime", "aws-app-works-internally-not-internet")'
            }
          },
          required: ['scenario_id']
        }
      },
      {
        name: 'decode_error',
        description: 'Decode an exit code, Kubernetes pod status, HTTP gateway error, or common Docker/ECS/AWS/Terraform/TLS/DNS error message (e.g. "137", "CrashLoopBackOff", "502", "Error acquiring the state lock"). Returns what it means, likely causes, diagnostic commands, fixes, and related incident scenarios. Offline and read-only.',
        inputSchema: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'The exit code, status, or error text (e.g. "137", "exit code 143", "OOMKilled", "502 Bad Gateway", "exec format error")'
            },
            platform: {
              type: 'string',
              description: 'Optional hint to rank matches: "kubernetes", "docker", "ecs", "aws", "terraform", "linux", "http", "network", or "tls"'
            }
          },
          required: ['error']
        }
      },
      {
        name: 'get_interview_elevator_pitch',
        description: 'Retrieve a senior DevOps/SRE candidate elevator pitch structured in the STAR framework (Situation, Task, Action, Result) with quantifiable production metrics.',
        inputSchema: {
          type: 'object',
          properties: {
            scenario_id: {
              type: 'string',
              description: 'The scenario slug or ID'
            }
          },
          required: ['scenario_id']
        }
      },
      {
        name: 'generate_k8s_manifest',
        description: 'Generate production-hardened, linted Kubernetes YAML manifests (Deployment, Service, HPA, PDB) with non-root securityContext, probes, and resource requests/limits.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Workload or application name (e.g. "api-gateway")'
            },
            image: {
              type: 'string',
              description: 'Container image (e.g. "nginx:alpine" or "myorg/api:v1.2.0")'
            },
            kind: {
              type: 'string',
              description: 'Manifest type: "Deployment", "Service", "HPA", "PDB", or "all" (default: "all")',
              enum: ['Deployment', 'Service', 'HPA', 'PDB', 'all']
            },
            namespace: {
              type: 'string',
              description: 'Kubernetes namespace (default: "production")'
            },
            replicas: {
              type: 'number',
              description: 'Initial replica count (default: 3)'
            },
            port: {
              type: 'number',
              description: 'Container port (default: 8080)'
            },
            cpu_request: {
              type: 'string',
              description: 'CPU request (default: "100m")'
            },
            memory_limit: {
              type: 'string',
              description: 'Memory limit (default: "256Mi")'
            },
            enable_security_context: {
              type: 'boolean',
              description: 'Enforces runAsNonRoot: true, drops ALL capabilities, read-only root filesystem (default: true)'
            },
            enable_hpa: {
              type: 'boolean',
              description: 'Includes paired HorizontalPodAutoscaler manifest (default: true)'
            }
          },
          required: ['name', 'image']
        }
      },
      {
        name: 'get_devops_cheat_sheet',
        description: 'Instant terminal lookup for dense command references and mental models: "ansible", "kubectl", "subnetting" (CIDR magic number), or "terraform".',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'The cheat sheet topic',
              enum: ['ansible', 'kubectl', 'subnetting', 'terraform']
            }
          },
          required: ['topic']
        }
      },
      {
        name: 'get_architectural_blueprint',
        description: 'Retrieve battle-tested cloud architecture blueprints authored by Naveed Ahmed: "aws-zero-downtime-migration", "reduce-aws-costs", "terraform-multi-account-saas", or "agentic-sdlc".',
        inputSchema: {
          type: 'object',
          properties: {
            blueprint: {
              type: 'string',
              description: 'The blueprint identifier',
              enum: ['aws-zero-downtime-migration', 'reduce-aws-costs', 'terraform-multi-account-saas', 'agentic-sdlc']
            }
          },
          required: ['blueprint']
        }
      }
    ]
  };
});

// Tool Execution Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'search_incident_scenarios':
        return handleSearchScenarios(args as any);
      case 'get_scenario_runbook':
        return handleGetRunbook(args as any);
      case 'decode_error':
        return handleDecodeError(args as any);
      case 'get_interview_elevator_pitch':
        return handleGetElevatorPitch(args as any);
      case 'generate_k8s_manifest':
        return handleGenerateK8sYaml(args as any);
      case 'get_devops_cheat_sheet':
        return handleGetCheatsheet(args as any);
      case 'get_architectural_blueprint':
        return handleGetBlueprint(args as any);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool "${name}": ${err?.message || String(err)}`
        }
      ],
      isError: true
    };
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. RESOURCES REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: RESOURCES
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return handleReadResource(request.params.uri);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PROMPTS REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: PROMPTS
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  return handleGetPrompt(request.params.name, request.params.arguments);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. SERVER LAUNCH (STDIO TRANSPORT)
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('[devops-mcp] Naveed Ahmed DevOps MCP Server connected over stdio.\n');
}

main().catch((error) => {
  process.stderr.write(`[devops-mcp] Fatal server error: ${error}\n`);
  process.exit(1);
});
