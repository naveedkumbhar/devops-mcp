import { initSearchIndex } from '../dist/search.js';
import { matchErrors } from '../dist/decode.js';
import { handleDecodeError } from '../dist/tools/decodeError.js';
import { ERRORS } from '../dist/data/errors.js';

initSearchIndex();
const failures = [];
const fail = (msg) => failures.push(msg);

// 1. Data integrity
const ids = new Set();
for (const e of ERRORS) {
  if (ids.has(e.id)) fail(`duplicate id ${e.id}`);
  ids.add(e.id);
  if (!e.title || !e.meaning || !e.search) fail(`${e.id}: missing title/meaning/search`);
  for (const f of ['causes', 'diagnose', 'fix']) {
    if (!Array.isArray(e[f]) || e[f].length === 0) fail(`${e.id}: empty ${f}`);
  }
  if (!(e.codes && e.codes.length) && !(e.patterns && e.patterns.length)) fail(`${e.id}: no codes or patterns`);
  for (const p of e.patterns || []) if (p !== p.toLowerCase()) fail(`${e.id}: pattern not lowercase: ${p}`);
}

// 2. Every entry is reachable from its own trigger
for (const e of ERRORS) {
  const probes = [
    ...(e.patterns || []).map((p) => p),
    ...(e.codes || []).map((c) => (e.kind === 'http' ? `HTTP ${c}` : `exit code ${c}`))
  ];
  for (const probe of probes) {
    const top = matchErrors(probe, undefined, 3).map((m) => m.entry.id);
    if (!top.includes(e.id)) fail(`${e.id}: trigger "${probe}" returned [${top.join(', ')}]`);
  }
}

// 3. Golden cases: [input, platform, expected top-1 id]
const golden = [
  ['137', undefined, 'exit-code-137'],
  ['container exited with code 137', 'docker', 'exit-code-137'],
  ['exit code 1', undefined, 'exit-code-1'],
  ['Exited (143) 2 minutes ago', undefined, 'exit-code-143'],
  ['Back-off restarting failed container', undefined, 'k8s-crashloopbackoff'],
  ['Reason: OOMKilled', undefined, 'k8s-oomkilled'],
  ['502 Bad Gateway', undefined, 'http-502'],
  ['upstream returned 504 gateway timeout', undefined, 'http-504'],
  ['Error acquiring the state lock', undefined, 'terraform-state-lock'],
  ['exec /app/server: exec format error', undefined, 'exec-format-error'],
  ['CannotPullContainerError: pull image manifest has been retried', undefined, 'ecs-cannotpullcontainererror'],
  ['0/3 nodes are available: 3 Insufficient memory', undefined, 'k8s-failedscheduling'],
  ['x509: certificate signed by unknown authority', undefined, 'tls-x509'],
  ['An error occurred (AccessDenied) when calling the PutObject operation', undefined, 'aws-access-denied']
];
for (const [input, platform, want] of golden) {
  const got = matchErrors(input, platform, 1)[0]?.entry.id;
  if (got !== want) fail(`golden "${input}": expected ${want}, got ${got}`);
}

// 4. No false positives on unrelated or ambiguous text
for (const input of ['hello world', 'listening on port 8080', 'version 1.2.3 released', '10.0.0.2 reachable']) {
  const got = matchErrors(input).map((m) => m.entry.id);
  if (got.length) fail(`false positive for "${input}": ${got.join(', ')}`);
}
if (matchErrors('exit code 1')[0]?.entry.id === 'exit-code-137') fail('exit code 1 matched 137');

// 5. Handler output
const out = handleDecodeError({ error: '137' }).content[0].text;
for (const needle of ['SIGKILL', 'docker inspect', 'Related incident scenarios', 'Naveed Ahmed']) {
  if (!out.includes(needle)) fail(`handler output missing "${needle}"`);
}
const none = handleDecodeError({ error: 'zzqx unknowable' });
if (none.isError || !none.content[0].text.includes('No known error pattern')) fail('fallback output wrong');
if (!handleDecodeError({ error: '  ' }).isError) fail('empty input should be an error');

if (failures.length) {
  console.error(`❌ ${failures.length} decode_error failures`);
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`✅ decode_error: ${ERRORS.length} entries consistent, ${golden.length} golden cases pass`);
