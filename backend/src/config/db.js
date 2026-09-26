const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool,
};
