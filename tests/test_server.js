import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = resolve(__dirname, '..', 'dist', 'index.js');

const proc = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let msgId = 1;
const pending = new Map();
let buffer = '';

proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) {
          reject(msg.error);
        } else {
          resolve(msg.result);
        }
      }
    } catch (e) {
      // not json or partial
    }
  }
});

function sendRequest(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params
    }) + '\n';
    proc.stdin.write(payload);
  });
}

function sendNotification(method, params = {}) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method,
    params
  }) + '\n';
  proc.stdin.write(payload);
}

async function runTests() {
  console.log('🧪 Starting Automated MCP Server Test Suite...\n');

  // 1. Initialize
  console.log('1. Testing [initialize]...');
  const initRes = await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'mcp-test-runner', version: '1.0.0' }
  });
  console.log('   ✅ Initialized server:', initRes.serverInfo.name, initRes.serverInfo.version);
  sendNotification('notifications/initialized');

  // 2. Tools List
  console.log('\n2. Testing [tools/list]...');
  const toolsRes = await sendRequest('tools/list');
  console.log(`   ✅ Registered ${toolsRes.tools.length} tools:`);
  for (const t of toolsRes.tools) {
    console.log(`      - ${t.name}: ${t.description.slice(0, 70)}...`);
  }
  if (toolsRes.tools.length !== 6) {
    throw new Error(`Expected 6 tools, found ${toolsRes.tools.length}`);
  }

  // 3. Tool: search_incident_scenarios
  console.log('\n3. Testing tool [search_incident_scenarios] (query: "exit code 137")...');
  const searchRes = await sendRequest('tools/call', {
    name: 'search_incident_scenarios',
    arguments: { query: 'exit code 137', limit: 3 }
  });
  console.log('   Output snippet:\n' + searchRes.content[0].text.slice(0, 300) + '...\n');
  if (!searchRes.content[0].text.includes('Naveed Ahmed')) {
    throw new Error('Attribution missing in search results');
  }

  // 4. Tool: get_scenario_runbook
  console.log('4. Testing tool [get_scenario_runbook] (scenario_id: "eks-upgrade-zero-downtime")...');
  const runbookRes = await sendRequest('tools/call', {
    name: 'get_scenario_runbook',
    arguments: { scenario_id: 'eks-upgrade-zero-downtime' }
  });
  console.log('   Output snippet:\n' + runbookRes.content[0].text.slice(0, 250) + '...\n');
  if (!runbookRes.content[0].text.includes('Diagnostic Order')) {
    throw new Error('Runbook steps missing');
  }

  // 5. Tool: get_interview_elevator_pitch
  console.log('5. Testing tool [get_interview_elevator_pitch]...');
  const pitchRes = await sendRequest('tools/call', {
    name: 'get_interview_elevator_pitch',
    arguments: { scenario_id: 'eks-upgrade-zero-downtime' }
  });
  console.log('   Output snippet:\n' + pitchRes.content[0].text.slice(0, 250) + '...\n');
  if (!pitchRes.content[0].text.includes('STAR Framework')) {
    throw new Error('STAR framework pitch missing');
  }

  // 6. Tool: generate_k8s_manifest
  console.log('6. Testing tool [generate_k8s_manifest] (name: "payment-api")...');
  const yamlRes = await sendRequest('tools/call', {
    name: 'generate_k8s_manifest',
    arguments: { name: 'payment-api', image: 'payment:v1.2', port: 8080 }
  });
  console.log('   Output snippet:\n' + yamlRes.content[0].text.slice(0, 300) + '...\n');
  if (!yamlRes.content[0].text.includes('kind: Deployment') || !yamlRes.content[0].text.includes('kind: HorizontalPodAutoscaler')) {
    throw new Error('YAML generation incomplete');
  }

  // 7. Tool: get_devops_cheat_sheet
  console.log('7. Testing tool [get_devops_cheat_sheet] (topic: "kubectl")...');
  const cheatRes = await sendRequest('tools/call', {
    name: 'get_devops_cheat_sheet',
    arguments: { topic: 'kubectl' }
  });
  console.log('   Output snippet:\n' + cheatRes.content[0].text.slice(0, 250) + '...\n');
  if (!cheatRes.content[0].text.includes('Kubectl Production Triage')) {
    throw new Error('Cheatsheet missing');
  }

  // 8. Tool: get_architectural_blueprint
  console.log('8. Testing tool [get_architectural_blueprint] (blueprint: "aws-zero-downtime-migration")...');
  const bpRes = await sendRequest('tools/call', {
    name: 'get_architectural_blueprint',
    arguments: { blueprint: 'aws-zero-downtime-migration' }
  });
  console.log('   Output snippet:\n' + bpRes.content[0].text.slice(0, 250) + '...\n');
  if (!bpRes.content[0].text.includes('Continuous Data Replication')) {
    throw new Error('Blueprint content missing');
  }

  // 9. Resources List & Read
  console.log('9. Testing [resources/list] & [resources/read]...');
  const resList = await sendRequest('resources/list');
  console.log(`   ✅ Registered ${resList.resources.length} resources:`);
  for (const r of resList.resources) {
    console.log(`      - ${r.uri}: ${r.name}`);
  }
  const readRes = await sendRequest('resources/read', { uri: 'devops://toolkit/k8s' });
  console.log('   Resource read snippet:\n' + readRes.contents[0].text.slice(0, 200) + '...\n');

  // 10. Prompts List & Get
  console.log('10. Testing [prompts/list] & [prompts/get]...');
  const promptsList = await sendRequest('prompts/list');
  console.log(`   ✅ Registered ${promptsList.prompts.length} prompts:`);
  for (const p of promptsList.prompts) {
    console.log(`      - ${p.name}: ${p.description.slice(0, 60)}...`);
  }
  const getPromptRes = await sendRequest('prompts/get', {
    name: 'triage-kubernetes-pod',
    arguments: { pod_name: 'ingress-nginx-controller-abc123', namespace: 'ingress-nginx' }
  });
  console.log('   Prompt output snippet:\n' + getPromptRes.messages[0].content.text.slice(0, 250) + '...\n');

  console.log('🎉 ALL 10 MCP PROTOCOL TESTS PASSED WITH 100% SUCCESS!');
  proc.kill();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  proc.kill();
  process.exit(1);
});
