import { getScenarioById, searchScenarios } from '../search.js';
import { formatAttribution } from '../attribution.js';
import { renderStep, renderMistakes } from '../render.js';

export function handleGetRunbook(args: { scenario_id: string }) {
  const id = (args.scenario_id || '').trim();

  if (!id) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: scenario_id is required. Example: "eks-upgrade-zero-downtime" or "aws-app-works-internally-not-internet".'
        }
      ],
      isError: true
    };
  }

  let scenario = getScenarioById(id);

  // If exact ID not found, attempt fuzzy match
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
          text: `Scenario with ID or slug "${id}" not found. Use \`search_incident_scenarios\` to find valid scenario IDs.`
        }
      ],
      isError: true
    };
  }

  let stepsMarkdown = '';
  if (Array.isArray(scenario.steps) && scenario.steps.length > 0) {
    stepsMarkdown = scenario.steps.map((st, i) => renderStep(st, i)).join('\n\n');
  } else {
    stepsMarkdown = scenario.intro || 'Diagnostic procedure outlined in full interactive handbook.';
  }

  let mistakesSection = '';
  const mistakesMarkdown = renderMistakes(scenario.mistakesToAvoid);
  if (mistakesMarkdown) {
    mistakesSection = `\n## ⚠️ Critical Mistakes to Avoid in Production\n${mistakesMarkdown}\n`;
  }

  let takeawaySection = '';
  if (scenario.keyTakeaway) {
    takeawaySection = `\n## 💡 Key Architectural Takeaway\n${scenario.keyTakeaway}\n`;
  }

  const text = `# ${scenario.title}

> **Domain:** ${scenario.category} | **Subcategory:** ${scenario.subCategory} | **Level:** ${scenario.level}
> **Tags:** ${scenario.tags.join(', ')}

## Incident Context & Problem Statement
${scenario.question || scenario.summary}

${scenario.roleContext ? `**Role Context:** ${scenario.roleContext}\n` : ''}
## Diagnostic Order & Resolution Runbook
${stepsMarkdown}
${mistakesSection}${takeawaySection}
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
