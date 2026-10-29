/**
 * Concurrency gate for POST /jobs/apply (audit §4.4, Phase 5 acceptance).
 *
 * Fires N identical applies at the same instant and prints the status
 * histogram. Expected: exactly one 201 and the rest 409 ALREADY_APPLIED
 * (or 201 replays when --key is given), and never a 500.
 *
 * ⚠️  Creates a REAL application for the given candidate + job. Run against
 *     staging with a test candidate, then delete the application (and its
 *     auto-created conversation) afterwards.
 *
 * Usage:
 *   APPLY_TOKEN=<candidate access token> node scripts/verifyApplyConcurrency.js \
 *     --api=https://staging.example.com/api/v1 --job=<24-hex job id> [--n=10] [--key=apply:<jobId>]
 */
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [name, ...rest] = arg.replace(/^--/, '').split('=');
    return [name, rest.join('=')];
  }),
);

const api = (args.api || '').replace(/\/$/, '');
const jobId = args.job;
const count = Math.max(2, Number(args.n) || 10);
const token = process.env.APPLY_TOKEN;

if (!api || !jobId || !token) {
  console.error('Usage: APPLY_TOKEN=<token> node scripts/verifyApplyConcurrency.js --api=<base /api/v1> --job=<id> [--n=10] [--key=...]');
  process.exit(2);
}

const applyOnce = async () => {
  const res = await fetch(`${api}/jobs/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(args.key ? { 'Idempotency-Key': args.key } : {}),
    },
    body: JSON.stringify({ jobId }),
  });
  const body = await res.json().catch(() => ({}));
  const replayed = res.headers.get('idempotent-replayed') === 'true';
  return `${res.status}${body.code ? ` ${body.code}` : ''}${replayed ? ' (replay)' : ''}`;
};

const results = await Promise.all(Array.from({ length: count }, applyOnce));
const histogram = results.reduce((acc, key) => ({ ...acc, [key]: (acc[key] || 0) + 1 }), {});
console.table(histogram);

const created = results.filter((r) => r === '201').length;
const errors = results.filter((r) => r.startsWith('5')).length;
const pass = created <= 1 && errors === 0;
console.log(pass ? 'PASS: at most one new application, no 5xx.' : 'FAIL: duplicate creation or a 5xx.');
process.exit(pass ? 0 : 1);
