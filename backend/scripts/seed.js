import { readdir, readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import pool from '../src/config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const chainsDir = resolve(__dirname, '../seeds/chains');
const badgesFile = resolve(__dirname, '../seeds/badges.json');

async function seed() {
  const client = await pool.connect();
  try {
    const files = (await readdir(chainsDir)).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const raw = await readFile(resolve(chainsDir, file), 'utf-8');
      const data = JSON.parse(raw);

      const slug = data.slug || data.chain.toLowerCase().replace(/\s+/g, '-');

      // Upsert chain
      const { rows: [chain] } = await client.query(
        `INSERT INTO chains (name, slug, description, website, logo_url, location_count)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           website = EXCLUDED.website,
           logo_url = EXCLUDED.logo_url,
           location_count = EXCLUDED.location_count
         RETURNING id`,
        [data.chain, slug, data.description, data.website, data.logo_url || null, data.locations.length]
      );

      // Upsert locations
      for (const loc of data.locations) {
        await client.query(
          `INSERT INTO locations (chain_id, source_id, name, address, city, lat, lng)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (source_id) DO UPDATE SET
             name = EXCLUDED.name,
             address = EXCLUDED.address,
             city = EXCLUDED.city,
             lat = EXCLUDED.lat,
             lng = EXCLUDED.lng`,
          [chain.id, loc.id, loc.name, loc.address, loc.city, loc.lat, loc.lng]
        );
      }

      console.log(`  seeded  ${data.chain} (${data.locations.length} locations)`);
    }

    // Seed badges
    try {
      const badgesRaw = await readFile(badgesFile, 'utf-8');
      const badges = JSON.parse(badgesRaw);
      for (const badge of badges) {
        await client.query(
          `INSERT INTO badges (id, name, description, icon)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             icon = EXCLUDED.icon`,
          [badge.id, badge.name, badge.description, badge.icon]
        );
      }
      console.log(`  seeded ${badges.length} badges`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error seeding badges:', err);
      }
    }

    console.log('Seeding complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
