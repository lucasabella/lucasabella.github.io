# Geocode Accuracy Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all AI-generated coordinates with precise ones from OpenStreetMap Nominatim geocoding.

**Architecture:** A standalone Node.js script in `backend/scripts/geocode.js` reads chain JSON files, geocodes each address via Nominatim's free API (1 req/sec), and writes updated lat/lng back. No database or backend changes needed — just updated seed files, then re-seed.

**Tech Stack:** Node.js (ESM), native `fetch`, OpenStreetMap Nominatim API (free, no key)

**Design doc:** `docs/plans/2026-02-22-geocode-accuracy-design.md`

---

### Task 1: Create the geocode script

**Files:**
- Create: `backend/scripts/geocode.js`

**Step 1: Create `backend/scripts/geocode.js`**

```js
import { readdir, readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const chainsDir = resolve(__dirname, '../seeds/chains');
const dryRun = process.argv.includes('--dry-run');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DELAY_MS = 1100; // respect 1 req/sec rate limit

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocodeAddress(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'nl',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': 'ChainChaser-Geocoder/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Nominatim HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.length === 0) return null;

  return {
    lat: parseFloat(parseFloat(data[0].lat).toFixed(6)),
    lng: parseFloat(parseFloat(data[0].lon).toFixed(6)),
  };
}

async function geocodeChain(filePath) {
  const raw = await readFile(filePath, 'utf-8');
  const chain = JSON.parse(raw);
  const results = { success: 0, failed: 0, failures: [] };

  console.log(`\n${chain.chain} (${chain.locations.length} locations)`);

  for (const loc of chain.locations) {
    await sleep(DELAY_MS);

    try {
      const coords = await geocodeAddress(loc.address);

      if (!coords) {
        console.log(`  MISS  ${loc.name} — no results for "${loc.address}"`);
        results.failed++;
        results.failures.push({ name: loc.name, address: loc.address, reason: 'no results' });
        continue;
      }

      const oldLat = loc.lat;
      const oldLng = loc.lng;
      loc.lat = coords.lat;
      loc.lng = coords.lng;

      console.log(`  OK    ${loc.name}  (${oldLat},${oldLng}) → (${coords.lat},${coords.lng})`);
      results.success++;
    } catch (err) {
      console.log(`  ERR   ${loc.name} — ${err.message}`);
      results.failed++;
      results.failures.push({ name: loc.name, address: loc.address, reason: err.message });
    }
  }

  if (!dryRun) {
    await writeFile(filePath, JSON.stringify(chain, null, 2) + '\n');
    console.log(`  → wrote ${filePath}`);
  } else {
    console.log(`  → dry run, not writing`);
  }

  return results;
}

async function main() {
  console.log(dryRun ? 'DRY RUN — no files will be written\n' : 'LIVE RUN — files will be updated\n');

  const files = (await readdir(chainsDir)).filter((f) => f.endsWith('.json'));
  let totalSuccess = 0;
  let totalFailed = 0;
  const allFailures = [];

  for (const file of files) {
    const result = await geocodeChain(resolve(chainsDir, file));
    totalSuccess += result.success;
    totalFailed += result.failed;
    allFailures.push(...result.failures);
  }

  console.log(`\n--- Summary ---`);
  console.log(`Success: ${totalSuccess}`);
  console.log(`Failed:  ${totalFailed}`);

  if (allFailures.length > 0) {
    console.log(`\nFailed locations:`);
    for (const f of allFailures) {
      console.log(`  - ${f.name}: ${f.reason} (${f.address})`);
    }
  }
}

main().catch((err) => {
  console.error('Geocoding failed:', err);
  process.exit(1);
});
```

**Step 2: Add npm script to `backend/package.json`**

Add to `"scripts"`:
```json
"geocode": "node scripts/geocode.js"
```

**Step 3: Dry run to verify it works**

Run: `cd backend && npm run geocode -- --dry-run`

Expected: Output showing each location with old → new coordinates, no files written. Watch for any `MISS` or `ERR` entries.

**Step 4: Commit**

```bash
git add backend/scripts/geocode.js backend/package.json
git commit -m "feat: add Nominatim geocoding script for accurate coordinates"
```

---

### Task 2: Run the geocoding for real

**Files:**
- Modify: `backend/seeds/chains/*.json` (all 6 chain files)

**Step 1: Run live geocoding**

Run: `cd backend && npm run geocode`

Expected: All 178 locations geocoded, updated JSON files written. Note any failures.

**Step 2: Spot-check a few locations**

Pick 3-4 locations and verify coordinates on Google Maps:
- Paste coordinates like `52.354900, 4.892200` into Google Maps search
- Verify the pin lands on or very near the actual restaurant

**Step 3: Handle any failures**

If any addresses failed to geocode:
- Check if the address has a typo in the JSON
- Try a simplified version of the address (e.g. just street + city)
- As last resort, manually look up on Google Maps and update

**Step 4: Commit updated seed files**

```bash
git add backend/seeds/chains/
git commit -m "fix: update all location coordinates via Nominatim geocoding"
```

---

### Task 3: Re-seed the database

**Step 1: Run seed against production database**

Run: `cd backend && npm run seed`

Expected: All chains re-seeded with updated coordinates (upsert on source_id updates lat/lng).

**Step 2: Verify on the live site**

- Open the deployed app
- Navigate to a chain (e.g. Loetje)
- Zoom into Amsterdam — verify markers now sit on streets, not in canals
- Check a few other cities

**Step 3: Commit any remaining changes and push**

```bash
git push origin main
```
