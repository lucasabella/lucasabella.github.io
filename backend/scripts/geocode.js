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
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Geocoding failed:', err);
  process.exit(1);
});
