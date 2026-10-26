export const PROMPTS = [
    {
        name: 'triage-kubernetes-pod',
        description: 'Guided interactive incident triage for a failing or crashing Kubernetes pod (CrashLoopBackOff, OOMKilled 137, Pending, Probe failures).',
        arguments: [
            {
                name: 'pod_name',
                description: 'Name of the crashing or pending pod',
                required: true
            },
            {
                name: 'namespace',
                description: 'Kubernetes namespace (default: "default")',
                required: false
            }
        ]
    },
    {
        name: 'mock-devops-interview',
        description: 'Simulates a senior DevOps/SRE architectural interview drill using real-world scenarios from Naveed Ahmed\'s scenario handbook.',
        arguments: [
            {
                name: 'domain',
                description: 'Interview focus domain: "Kubernetes", "AWS", "Terraform", "Linux & SRE", "CI/CD & GitOps"',
                required: false
            }
        ]
    }
];
export function handleGetPrompt(name, args) {
    if (name === 'triage-kubernetes-pod') {
        const pod = args?.pod_name || '<pod-name>';
        const ns = args?.namespace || 'default';
        return {
            description: 'Systematic Kubernetes Pod Incident Triage',
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `I need to triage a crashing or failing pod \`${pod}\` in namespace \`${ns}\`.
Please follow Naveed Ahmed's systematic outside-in diagnostic order:
1. Ask me for the output of \`kubectl describe pod ${pod} -n ${ns}\` (specifically Last State, Exit Code, and Events).
2. Check previous container death logs with \`kubectl logs ${pod} -n ${ns} --previous --tail=100\`.
3. Use the \`@naveedkumbhar/devops-mcp\` tool \`search_incident_scenarios\` to find the exact production runbook for the detected exit code or error.
4. Walk me through the permanent fix and preventive guardrails.`
                    }
                }
            ]
        };
    }
    if (name === 'mock-devops-interview') {
        const domain = args?.domain || 'Kubernetes';
        return {
            description: 'Senior DevOps / Lead SRE Mock Scenario Interview',
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `You are acting as a Staff Platform Engineer interviewer conducting a senior DevOps/SRE technical interview focused on ${domain}.
Please:
1. Use \`@naveedkumbhar/devops-mcp\` tool \`search_incident_scenarios\` with query "${domain}" to select a complex real-world production incident.
2. Present the scenario to me with symptoms and role context.
3. Pause and wait for my proposed diagnostic approach.
4. Evaluate my answer against the STAR elevator pitch from \`get_interview_elevator_pitch\` and highlight any critical production mistakes I made.`
                    }
                }
            ]
        };
    }
    throw new Error(`Prompt "${name}" not found.`);
}
