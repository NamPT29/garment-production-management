import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDatabaseExists, pool, query } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

const ensureMigrationTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_filename (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

const getExecutedMigrations = async () => {
  const rows = await query('SELECT filename FROM schema_migrations ORDER BY filename ASC');
  return new Set(rows.map((row) => row.filename));
};

const run = async () => {
  await ensureDatabaseExists();
  await ensureMigrationTable();
  const executed = await getExecutedMigrations();
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`Skip migration ${file}`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await query(sql);
    await query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
    console.log(`Ran migration ${file}`);
  }
};

run()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
