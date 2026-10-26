import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initSearchIndex } from '../dist/search.js';
import { handleGetRunbook } from '../dist/tools/getRunbook.js';
import { htmlToMarkdown } from '../dist/render.js';

const here = dirname(fileURLToPath(import.meta.url));
const scenarios = JSON.parse(readFileSync(resolve(here, '..', 'src', 'data', 'scenarios.json'), 'utf-8'));
initSearchIndex();

const failures = [];
const fail = (id, msg) => failures.push(`${id}: ${msg}`);

for (const s of scenarios) {
  const text = handleGetRunbook({ scenario_id: s.id }).content[0].text;
  if (text.includes('[object Object]')) fail(s.id, 'contains [object Object]');
  if (!text.includes(s.title)) fail(s.id, 'resolved to a different scenario');

  for (const [i, st] of s.steps.entries()) {
    const where = `step ${i + 1}`;
    if (st.codeBlock) {
      const first = String(st.codeBlock).split('\n').find((l) => l.trim());
      if (first && !text.includes(first.trim())) fail(s.id, `${where} codeBlock dropped`);
    }
    for (const field of ['highlight', 'content']) {
      if (st[field] && !text.includes(htmlToMarkdown(st[field]).split('\n')[0])) fail(s.id, `${where} ${field} dropped`);
    }
    for (const it of st.items || []) {
      if (!text.includes(htmlToMarkdown(it).split('\n')[0])) fail(s.id, `${where} list item dropped`);
    }
    if (st.matrix && !text.includes(htmlToMarkdown(st.matrix.headers[0]))) fail(s.id, `${where} matrix dropped`);
    for (const p of st.pillars || []) {
      if (!text.includes(htmlToMarkdown(p.name))) fail(s.id, `${where} pillar dropped`);
    }
  }
  for (const m of Array.isArray(s.mistakesToAvoid) ? s.mistakesToAvoid : []) {
    if (m.mistake && !text.includes(htmlToMarkdown(m.mistake))) fail(s.id, 'mistake dropped');
  }
}

if (failures.length) {
  console.error(`❌ ${failures.length} runbook render failures across ${scenarios.length} scenarios`);
  console.error(failures.slice(0, 25).join('\n'));
  process.exit(1);
}
console.log(`✅ All ${scenarios.length} runbooks render every step field and mistake`);
