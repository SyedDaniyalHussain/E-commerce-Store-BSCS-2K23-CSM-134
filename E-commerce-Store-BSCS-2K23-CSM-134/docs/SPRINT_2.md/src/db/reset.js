const pool = require('./index');
(async () => {
  try {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Database reset. Run npm run migrate then npm run seed.');
  } finally { await pool.end(); }
})().catch(err => { console.error(err); process.exit(1); });
