export interface Mistake {
  mistake?: string;
  why?: string;
}

const KNOWN_TAGS = 'strong|b|em|i|code|pre|br|a|p|span|div|ul|ol|li|u|kbd|small|sup|sub';

export function htmlToMarkdown(html: unknown): string {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<(strong|b)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '**$3**')
    .replace(/<(em|i)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '*$3*')
    .replace(/<(code|kbd)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '`$3`')
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(new RegExp(`</?(${KNOWN_TAGS})(\\s[^>]*)?/?>`, 'gi'), '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

export function renderMistakes(mistakes: unknown): string {
  if (typeof mistakes === 'string') return mistakes.trim();
  if (!Array.isArray(mistakes)) return '';
  return mistakes
    .map((m) => {
      if (typeof m === 'string') return `- ${htmlToMarkdown(m)}`;
      const { mistake, why } = (m || {}) as Mistake;
      const head = htmlToMarkdown(mistake);
      const tail = htmlToMarkdown(why);
      if (!head && !tail) return '';
      return tail ? `- **${head}** — ${tail}` : `- **${head}**`;
    })
    .filter(Boolean)
    .join('\n');
}

function renderMatrix(matrix: any): string {
  if (!matrix || !Array.isArray(matrix.headers) || !Array.isArray(matrix.rows)) return '';
  const cell = (c: unknown) => htmlToMarkdown(String(c ?? '')).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const header = `| ${matrix.headers.map(cell).join(' | ')} |`;
  const sep = `| ${matrix.headers.map(() => '---').join(' | ')} |`;
  const rows = matrix.rows.map((r: unknown) => {
    const cells = Array.isArray(r) ? r : Object.values((r || {}) as Record<string, unknown>);
    return `| ${cells.map(cell).join(' | ')} |`;
  });
  const title = matrix.title ? `**${matrix.title}**\n\n` : '';
  return `${title}${[header, sep, ...rows].join('\n')}`;
}

export function renderStep(st: Record<string, any>, i: number): string {
  const parts: string[] = [];
  const title = st.title || `Phase ${i + 1}`;
  parts.push(`### Step ${i + 1}: ${htmlToMarkdown(title)}`);

  if (st.description) parts.push(htmlToMarkdown(st.description));
  if (st.content) parts.push(htmlToMarkdown(st.content));

  if (Array.isArray(st.items) && st.items.length > 0) {
    parts.push(st.items.map((it: unknown) => `- ${htmlToMarkdown(it)}`).join('\n'));
  }

  if (Array.isArray(st.pillars) && st.pillars.length > 0) {
    parts.push(
      st.pillars
        .map((p: any) => `- ${p.icon ? p.icon + ' ' : ''}**${htmlToMarkdown(p.name)}** — ${htmlToMarkdown(p.detail)}`)
        .join('\n')
    );
  }

  if (Array.isArray(st.flow) && st.flow.length > 0) {
    parts.push(st.flow.map((f: unknown) => htmlToMarkdown(f)).join(' → '));
  }

  const matrix = renderMatrix(st.matrix);
  if (matrix) parts.push(matrix);

  if (st.codeBlock) parts.push('```bash\n' + String(st.codeBlock).trimEnd() + '\n```');
  if (st.command) parts.push('```bash\n' + String(st.command).trimEnd() + '\n```');
  if (st.output) parts.push('```\n' + String(st.output).trimEnd() + '\n```');
  if (st.explanation) parts.push(`*Explanation:* ${htmlToMarkdown(st.explanation)}`);
  if (st.highlight) parts.push(`> ${htmlToMarkdown(st.highlight).replace(/\n/g, '\n> ')}`);

  return parts.join('\n\n');
}
