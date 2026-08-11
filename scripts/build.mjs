#!/usr/bin/env node
//
// Build site/data/index.json from mods/<author>@<id>/meta.json.
//
// Node standard library only, on purpose: an index that needs an npm install
// is an index that stops building the first time a transitive dependency
// breaks, and this one has to keep working unattended for years.
//
//   node scripts/build.mjs                 # metadata only
//   GITHUB_TOKEN=... node scripts/build.mjs --releases
//
// --releases is the important mode. Without it every entry gets latest=null
// and the launcher has no download URL, so the feed lists mods nobody can
// install. The workflow always passes it.

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SCHEMA_VERSION = 1;          // hard-gated by the engine; bump only with it
const withReleases = process.argv.includes('--releases');
const token = process.env.GITHUB_TOKEN || '';

async function latestRelease(slug) {
  const res = await fetch(`https://api.github.com/repos/${slug}/releases/latest`, {
    headers: Object.assign(
      { 'Accept': 'application/vnd.github+json', 'User-Agent': 'teb-mod-index' },
      token ? { Authorization: `Bearer ${token}` } : {}),
  });
  if (res.status === 404) return { skip: 'no releases yet' };
  if (res.status === 403) throw new Error('GitHub rate limit reached (set GITHUB_TOKEN)');
  if (!res.ok) return { skip: `HTTP ${res.status}` };
  const r = await res.json();
  // A source archive is not a mod: codeload returns the repository, whose
  // folder layout the loader cannot use. Only a real .zip asset counts.
  const zip = (r.assets || []).find((a) => a.name.endsWith('.zip'));
  if (!zip) return { skip: 'release has no .zip asset' };
  return {
    latest: {
      version: r.tag_name.replace(/^v/, ''),
      tag: r.tag_name,
      name: r.name || r.tag_name,
      prerelease: !!r.prerelease,
      published_at: r.published_at,
      zip: { name: zip.name, url: zip.browser_download_url, size: zip.size },
    },
  };
}

const dirs = existsSync('mods')
  ? readdirSync('mods', { withFileTypes: true }).filter((d) => d.isDirectory())
  : [];

const mods = [];
for (const d of dirs) {
  const base = join('mods', d.name);
  const meta = JSON.parse(readFileSync(join(base, 'meta.json'), 'utf8'));
  const entry = Object.assign({ folder: d.name }, meta);

  const desc = join(base, 'description.md');
  if (existsSync(desc)) entry.description_url = `data/mods/${d.name}/description.md`;
  const thumb = join(base, 'thumbnail.png');
  if (existsSync(thumb)) entry.thumbnail = `data/mods/${d.name}/thumbnail.png`;

  entry.update_check = 'pending';
  if (withReleases && meta.github) {
    try {
      const r = await latestRelease(meta.github);
      if (r.latest) {
        entry.latest = r.latest;
        entry.version = r.latest.version;   // the release is the truth, not meta
        entry.update_check = 'ok';
        entry.last_release = r.latest.published_at.slice(0, 10);
      } else {
        entry.update_check = r.skip;
        console.warn(`  ! ${meta.id}: ${r.skip}`);
      }
    } catch (e) {
      entry.update_check = String(e.message);
      console.warn(`  ! ${meta.id}: ${e.message}`);
    }
  }
  mods.push(entry);
}

mods.sort((a, b) => a.id.localeCompare(b.id));

// Copy descriptions and thumbnails next to the feed so the launcher's card
// can fetch them with a relative path from the same base.
for (const d of dirs) {
  for (const root of ['site', 'docs']) {
  const out = join(root, 'data', 'mods', d.name);
  mkdirSync(out, { recursive: true });
  for (const f of ['description.md', 'thumbnail.png']) {
    const src = join('mods', d.name, f);
    if (existsSync(src)) writeFileSync(join(out, f), readFileSync(src));
  }
  }
}

const index = {
  schema_version: SCHEMA_VERSION,
  generated_at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  count: mods.length,
  categories: [...new Set(mods.flatMap((m) => m.categories || []))].sort(),
  mods,
};
// Written to BOTH roots on purpose. The engine resolves "owner/repo" to a
// Pages URL and falls back to raw.githubusercontent's site/ path, and Pages
// served from a branch only accepts / or /docs -- so site/ satisfies the
// fallback and docs/ satisfies Pages. One build, both URLs live.
for (const root of ['site', 'docs']) {
  mkdirSync(root + '/data', { recursive: true });
  writeFileSync(root + '/data/index.json',
    JSON.stringify(index, null, 2) + '\n');
}
console.log(`wrote site/data/index.json - ${mods.length} mod(s)`
  + (withReleases ? ', releases resolved' : ' (NO release info; pass --releases)'));
