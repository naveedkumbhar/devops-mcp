import { getScenarioById, searchScenarios } from '../search.js';
import { formatAttribution } from '../attribution.js';
export function handleGetElevatorPitch(args) {
    const id = (args.scenario_id || '').trim();
    if (!id) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: scenario_id is required. Example: "eks-upgrade-zero-downtime".'
                }
            ],
            isError: true
        };
    }
    let scenario = getScenarioById(id);
    if (!scenario) {
        const fallback = searchScenarios(id, undefined, 1);
        if (fallback.length > 0) {
            scenario = fallback[0];
        }
    }
    if (!scenario) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Scenario with ID or slug "${id}" not found. Use \`search_incident_scenarios\` to find valid IDs.`
                }
            ],
            isError: true
        };
    }
    const pitch = scenario.elevatorPitch || 'STAR format elevator pitch available in the full interactive handbook.';
    const text = `# STAR Framework Elevator Pitch: ${scenario.title}

> **Target Interview Level:** ${scenario.level || 'Senior DevOps / Lead SRE'}
> **Category:** ${scenario.category} (${scenario.subCategory})

## 🎙️ 60-Second Verbal Elevator Pitch (STAR Framework)
${pitch}

## Key Production Takeaway
${scenario.keyTakeaway || 'Demonstrates systematic outside-in triage, root cause isolation, and automated prevention guardrails.'}

${formatAttribution({ scenarioId: scenario.id })}`;
    return {
        content: [
            {
                type: 'text',
                text
            }
        ]
    };
}
