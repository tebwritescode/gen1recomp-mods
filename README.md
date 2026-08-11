# Teb's Gen1Recomp mods

A small mod index for [Gen1Recomp](https://github.com/bryanthaboi/gen1recomp)
carrying **only my own mods**, so a new release shows up in my game without
waiting on anyone else's catalogue.

## Add it to your game

Launcher → **Find Mods** → add source:

```
tebwritescode/gen1recomp-mods
```

The launcher resolves that on its own. Adding an index is a deliberate act of
trusting whoever publishes it — this one is mine.

For the wider community catalogue, add
`bryanthaboi/gen1recomp-mod-index` as well. The two coexist.

## What this is

Metadata only. No mod code lives here: each entry points at its own
repository, and installs go through the same zip import that "Import mod .zip"
uses. A listing buys a mod no trust it would not otherwise have.

## How it stays current

`scripts/build.mjs --releases` reads `mods/*/meta.json`, asks GitHub for each
mod's latest release, and writes `site/data/index.json`. A workflow runs it on
every push and **nightly** — a mod's version lives in its own repo's releases,
so without the schedule this feed would freeze and every release would need a
commit here.

Only a real `.zip` **release asset** is used. A source archive is not a mod:
codeload hands back the repository, whose folder layout the loader cannot use.

## Adding a mod

```
mods/<author>@<id>/meta.json          required: id, title, author, version,
mods/<author>@<id>/description.md     categories, repo
mods/<author>@<id>/thumbnail.png      optional
```

Set `"github": "owner/repo"` and the nightly job keeps the version honest.
Categories are the SHOUTY set the engine uses: `GAMEPLAY`, `CONTENT`,
`BALANCE`, `ART`, `AUDIO`, `UI`, `QOL`, `TRANSLATION`, `TOTAL_CONVERSION`,
`LIBRARY`, `TOOL`, `OTHER`.

Then:

```sh
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs --releases
```

## Enabling the nightly refresh

The workflow that rebuilds this feed sits in `workflow-to-install/build.yml`
rather than `.github/workflows/`, because pushing an Actions file needs a
token with the `workflow` scope and the one used to create this repo did not
have it. **The index works without it** — the feed is committed and Pages
serves it — but versions will not refresh on their own until it is installed:

```sh
gh auth refresh -s workflow          # one-time, opens a browser
git mv workflow-to-install/build.yml .github/workflows/build.yml
git commit -am "Enable the nightly index rebuild" && git push
```

Until then, rebuild by hand after tagging a release:

```sh
GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs --releases
git commit -am "Rebuild feed" && git push
```
