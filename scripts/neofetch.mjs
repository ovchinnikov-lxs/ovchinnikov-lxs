// Renders assets/neofetch.svg: a terminal-style profile card in the portfolio's style.
// Live lines (languages, contributions, latest repo) come from the GitHub GraphQL API.
// Usage: GITHUB_TOKEN=… node scripts/neofetch.mjs    (or --mock for a local preview)
import { readFileSync, writeFileSync } from 'node:fs';

const USER = 'ovchinnikov-lxs';
const CAREER_START = 2020;
const mock = process.argv.includes('--mock');

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection { contributionCalendar { totalContributions } }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes { name pushedAt languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } } }
    }
  }
}`;

async function load() {
  if (mock) {
    return {
      contributions: 306,
      languages: [['TypeScript', 64], ['Vue', 21], ['SCSS', 9], ['JavaScript', 4]],
      latest: { name: 'ovchinnikov-lxs.github.io', pushedAt: new Date().toISOString() },
    };
  }
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  const { data, errors } = await res.json();
  if (errors) throw new Error(JSON.stringify(errors));
  const repos = data.user.repositories.nodes.filter((r) => r.name !== USER);
  const bytes = new Map();
  for (const r of repos) for (const e of r.languages.edges) bytes.set(e.node.name, (bytes.get(e.node.name) ?? 0) + e.size);
  const total = [...bytes.values()].reduce((a, b) => a + b, 0) || 1;
  const languages = [...bytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, size]) => [name, Math.round((size / total) * 100)]);
  return { contributions: data.user.contributionsCollection.contributionCalendar.totalContributions, languages, latest: repos[0] };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const date = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const d = await load();
const years = new Date().getUTCFullYear() - CAREER_START;
const lines = [
  ['Role', 'Frontend Engineer · product & multi-brand web apps'],
  ['Uptime', `${years}+ years (since ${CAREER_START})`],
  ['Stack', 'Vue/Nuxt · Angular · React/Next · TypeScript'],
  ['Impact', '3× faster delivery · 2.5× faster pages · 10-min releases'],
  ['Languages', d.languages.map(([n, p]) => `${n} ${p}%`).join(' · ')],
  ['Activity', `${d.contributions} contributions in the last year`],
  ['Latest', d.latest ? `${d.latest.name} · ${date(d.latest.pushedAt)}` : '—'],
  ['Location', 'Lisbon, PT · no relocation needed'],
  ['Status', '● open to new opportunities', '#c6f432'],
];

// "AO" as a pixel monogram; stray pixels around it flicker like the site's reveal fringe.
const glyph = ['..XXX.....XXX..', '.X...X...X...X.', 'X.....X.X.....X', 'X.....X.X.....X', 'XXXXXXX.X.....X', 'X.....X.X.....X', 'X.....X.X.....X', 'X.....X..X...X.', 'X.....X...XXX..'];
const PAL = ['#a78bfa', '#60a5fa', '#67e8f9', '#c6f432', '#f472b6'];
let seed = 9;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const C = 20;
const GX = 68;
const GY = 150;
const pixels = [];
glyph.forEach((row, y) =>
  [...row].forEach((ch, x) => {
    const on = ch === 'X';
    if (!on && rnd() > 0.14) return;
    const color = on ? (rnd() < 0.2 ? PAL[(x + y) % 5] : '#f4f4f5') : PAL[(x * 3 + y) % 5];
    const flicker = !on || rnd() < 0.15;
    const style = flicker ? ` class="f" style="animation-duration:${(0.8 + rnd() * 1.8).toFixed(2)}s;animation-delay:-${(rnd() * 2).toFixed(2)}s"` : '';
    pixels.push(`<rect x="${GX + x * C}" y="${GY + y * C}" width="${C}" height="${C}" fill="${color}" opacity="${on ? 1 : 0.6}"${style}/>`);
  }),
);

const font = readFileSync(new URL('../assets/fonts/GeistMono-Latin.woff2', import.meta.url)).toString('base64');
const TX = 430;
const LH = 30;
const text = lines
  .map(([k, v, color], i) => `<text x="${TX}" y="${164 + i * LH}"><tspan fill="#c6f432">${esc(k)}</tspan><tspan fill="#71717a">: </tspan><tspan fill="${color ?? '#e4e4e7'}">${esc(v)}</tspan></text>`)
  .join('\n  ');
const palette = [...PAL, '#e4e4e7'].map((c, i) => `<rect x="${TX + i * 32}" y="${164 + lines.length * LH - 6}" width="26" height="14" fill="${c}"/>`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="480" viewBox="0 0 1280 480" role="img" aria-label="${esc(lines.map(([k, v]) => `${k}: ${v}`).join('; '))}">
<style>
  @font-face { font-family: 'Geist Mono'; src: url(data:font/woff2;base64,${font}) format('woff2'); }
  text { font: 18px 'Geist Mono', ui-monospace, Menlo, monospace; }
  .f { animation: f steps(1) infinite; }
  @keyframes f { 0% { opacity: .6 } 35% { opacity: .1 } 60% { opacity: .9 } 80% { opacity: 0 } }
  @media (prefers-reduced-motion: reduce) { .f { animation: none } }
</style>
<defs>
  <radialGradient id="g1" cx="96%" cy="-10%" r="45%"><stop offset="0" stop-color="#a78bfa" stop-opacity=".35"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/></radialGradient>
  <radialGradient id="g2" cx="0%" cy="100%" r="40%"><stop offset="0" stop-color="#c6f432" stop-opacity=".14"/><stop offset="1" stop-color="#c6f432" stop-opacity="0"/></radialGradient>
  <linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".045"/><stop offset="1" stop-color="#ffffff" stop-opacity=".015"/></linearGradient>
</defs>
<rect width="1280" height="480" rx="20" fill="#08080a"/>
<rect width="1280" height="480" rx="20" fill="url(#g1)"/>
<rect width="1280" height="480" rx="20" fill="url(#g2)"/>
<rect x="24.5" y="24.5" width="1231" height="431" rx="18" fill="url(#win)" stroke="#ffffff" stroke-opacity=".12"/>
<line x1="25" y1="66" x2="1255" y2="66" stroke="#ffffff" stroke-opacity=".08"/>
<circle cx="48" cy="45" r="6" fill="#3f3f46"/><circle cx="68" cy="45" r="6" fill="#3f3f46"/><circle cx="88" cy="45" r="6" fill="#3f3f46"/>
<text x="110" y="51" style="font-size:14px" fill="#71717a">${USER}@github: ~ — neofetch</text>
${pixels.join('')}
<text x="${TX}" y="108"><tspan fill="#a78bfa">aleksandr</tspan><tspan fill="#71717a">@</tspan><tspan fill="#a78bfa">${USER}</tspan></text>
<text x="${TX}" y="134" fill="#3f3f46">────────────────────────────────</text>
  ${text}
${palette}
</svg>
`;
writeFileSync(new URL('../assets/neofetch.svg', import.meta.url), svg);
console.log('neofetch.svg written', svg.length, 'bytes');
