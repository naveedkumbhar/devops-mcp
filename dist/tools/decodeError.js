import { matchErrors } from '../decode.js';
import { searchScenarios } from '../search.js';
import { formatAttribution } from '../attribution.js';
export function handleDecodeError(args) {
    const input = (args.error || '').trim();
    if (!input) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: an error string is required. Examples: "137", "exit code 143", "CrashLoopBackOff", "502 Bad Gateway", "Error acquiring the state lock".'
                }
            ],
            isError: true
        };
    }
    const matches = matchErrors(input, args.platform);
    if (matches.length === 0) {
        const related = searchScenarios(input, undefined, 3);
        const relatedMd = related.length
            ? related.map((s) => `- \`${s.id}\`: ${s.title}`).join('\n')
            : '- No related scenarios found.';
        return {
            content: [
                {
                    type: 'text',
                    text: `# No known error pattern matched

Input: \`${input}\`

\`decode_error\` covers common exit codes, Kubernetes statuses, HTTP gateway errors, and frequent Docker, ECS, AWS, Terraform, TLS and DNS errors. Try pasting the exact error line, or search the incident library.

## Closest incident scenarios
${relatedMd}

*Use \`search_incident_scenarios\` for a wider search, then \`get_scenario_runbook\` for the full runbook.*
${formatAttribution()}`
                }
            ]
        };
    }
    const sections = matches.map(({ entry }, i) => {
        const heading = i === 0 ? '##' : '###';
        const related = searchScenarios(entry.search, undefined, 3);
        const relatedMd = related.length
            ? `\n**Related incident scenarios** (use \`get_scenario_runbook\`):\n${related.map((s) => `- \`${s.id}\`: ${s.title}`).join('\n')}\n`
            : '';
        return `${heading} ${entry.title}
**What it means:** ${entry.meaning}

**Likely causes:**
${entry.causes.map((c) => `- ${c}`).join('\n')}

**Diagnose:**
\`\`\`bash
${entry.diagnose.join('\n')}
\`\`\`

**Fix:**
${entry.fix.map((f) => `- ${f}`).join('\n')}
${relatedMd}`;
    });
    const text = `# Error decoded: \`${input}\`
${matches.length > 1 ? `\nTop ${matches.length} matches, best first. Confirm which one applies with the diagnose commands before changing anything.\n` : ''}
${sections.join('\n')}
${formatAttribution()}`;
    return { content: [{ type: 'text', text }] };
}
