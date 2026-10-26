import { ERRORS, ErrorEntry } from './data/errors.js';

const PLATFORM_ALIASES: Record<string, string> = {
  k8s: 'kubernetes',
  kubernetes: 'kubernetes',
  docker: 'docker',
  ecs: 'ecs',
  fargate: 'ecs',
  aws: 'aws',
  terraform: 'terraform',
  linux: 'linux',
  http: 'http',
  network: 'network',
  tls: 'tls'
};

export interface ErrorMatch {
  entry: ErrorEntry;
  score: number;
}

function codeScore(text: string, code: number): number {
  const trimmed = text.trim();
  if (trimmed === String(code)) return 9;

  const numRe = new RegExp(`(^|\\D)${code}(?!\\d)`);
  if (!numRe.test(text)) return 0;

  if (code < 10) {
    const ctx = new RegExp(`(exit|exited|status|code)\\D{0,12}(?<!\\d)${code}(?!\\d)`);
    return ctx.test(text) ? 8 : 0;
  }
  return /(exit|exited|status|code|signal|http|error|response)/.test(text) ? 8 : 4;
}

export function matchErrors(input: string, platform?: string, limit = 3): ErrorMatch[] {
  const text = (input || '').toLowerCase();
  if (!text.trim()) return [];
  const kind = platform ? PLATFORM_ALIASES[platform.toLowerCase()] : undefined;

  const matches: ErrorMatch[] = [];
  for (const entry of ERRORS) {
    let score = 0;
    for (const p of entry.patterns || []) {
      if (text.includes(p)) score += 10 + Math.min(p.length / 20, 2);
    }
    for (const c of entry.codes || []) {
      score += codeScore(text, c);
    }
    if (score > 0 && kind && entry.kind === kind) score += 2;
    if (score > 0) matches.push({ entry, score });
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, Math.min(limit, 5));
}
