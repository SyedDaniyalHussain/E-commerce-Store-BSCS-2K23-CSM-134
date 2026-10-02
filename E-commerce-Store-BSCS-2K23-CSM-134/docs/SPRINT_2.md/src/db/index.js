const { Pool } = require('pg');
const env = require('../config/env');

if (!env.databaseUrl) throw new Error('DATABASE_URL is required');
if (!env.jwtSecret) throw new Error('JWT_SECRET is required');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false
});

module.exports = pool;
