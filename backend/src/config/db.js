import pg from 'pg';
import config from './env.js';

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
});

export default pool;
