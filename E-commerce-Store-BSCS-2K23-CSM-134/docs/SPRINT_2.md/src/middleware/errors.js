function notFound(req, res) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }); }
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === '23505') return res.status(409).json({ error: { code: 'DUPLICATE', message: 'A record with the same unique value already exists.' } });
  if (err.code === '23503') return res.status(400).json({ error: { code: 'FOREIGN_KEY', message: 'Referenced record does not exist or cannot be changed.' } });
  if (err.code === '23514' || err.code === '22P02') return res.status(400).json({ error: { code: 'DB_VALIDATION', message: 'The supplied data violates a database rule.' } });
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } });
}
module.exports = { notFound, errorHandler };
