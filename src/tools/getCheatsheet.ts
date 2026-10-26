import { CHEATSHEETS } from '../data/cheatsheets.js';
import { formatAttribution } from '../attribution.js';

export function handleGetCheatsheet(args: { topic: string }) {
  const topic = (args.topic || '').toLowerCase().trim();

  if (!topic) {
    const available = Object.keys(CHEATSHEETS).join(', ');
    return {
      content: [
        {
          type: 'text',
          text: `Error: topic is required. Available cheatsheets: ${available}`
        }
      ],
      isError: true
    };
  }

  const sheet = CHEATSHEETS[topic];

  if (!sheet) {
    const available = Object.keys(CHEATSHEETS).join(', ');
    return {
      content: [
        {
          type: 'text',
          text: `Cheatsheet "${topic}" not found. Available topics: ${available}`
        }
      ],
      isError: true
    };
  }

  const text = `${sheet.content}
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
