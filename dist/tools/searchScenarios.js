import { searchScenarios } from '../search.js';
import { formatAttribution } from '../attribution.js';
export function handleSearchScenarios(args) {
    const query = args.query;
    const category = args.category;
    const limit = args.limit || 5;
    if (!query || query.trim() === '') {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: A search query string is required. Example: "exit code 137" or "DynamoDB state lock".'
                }
            ],
            isError: true
        };
    }
    const results = searchScenarios(query, category, limit);
    if (results.length === 0) {
        return {
            content: [
                {
                    type: 'text',
                    text: `No incident scenarios found matching query: "${query}"${category ? ` in category "${category}"` : ''}.\nTry broader terms like "kubernetes", "dns", "oomkilled", "terraform", "aws", or "ansible".`
                }
            ]
        };
    }
    const formatted = results.map((s, idx) => {
        return `### ${idx + 1}. [${s.title}](https://interview.naveedkumbhar.com/questions/${s.id}/?utm_source=mcp&utm_medium=agent)
- **ID:** \`${s.id}\`
- **Domain:** ${s.category} (${s.subCategory || 'General'})
- **Level:** ${s.level || 'Senior DevOps / SRE'}
- **Tags:** ${s.tags.slice(0, 6).join(', ')}
- **Summary:** ${s.summary || s.question}
`;
    }).join('\n');
    const text = `# Production Incident Scenarios Search Results
Found **${results.length}** scenarios matching query: \`${query}\`

${formatted}
*Tip: Use \`get_scenario_runbook\` with the Scenario ID above to retrieve the exact CLI commands, root cause tree, and mistakes to avoid.*

${formatAttribution()}`;
    return {
        content: [
            {
                type: 'text',
                text
            }
        ]
    };
}
