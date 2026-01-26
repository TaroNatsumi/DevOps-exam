const { Pool } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://helpdesk:helpdesk@localhost:5432/helpdesk";

const pool = new Pool({ connectionString: DATABASE_URL });

async function initDb() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS tickets (" +
      "id SERIAL PRIMARY KEY," +
      "title VARCHAR(200) NOT NULL," +
      "description TEXT DEFAULT ''," +
      "status VARCHAR(20) DEFAULT 'open'," +
      "created_at TIMESTAMPTZ DEFAULT NOW()" +
      ")"
  );
}

module.exports = { pool, initDb };
