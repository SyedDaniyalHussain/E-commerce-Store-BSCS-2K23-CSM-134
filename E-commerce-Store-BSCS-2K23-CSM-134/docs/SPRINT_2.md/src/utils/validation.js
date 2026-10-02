function isNonEmptyString(value) { return typeof value === 'string' && value.trim().length > 0; }
function isSlug(value) { return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value); }
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function isValidSpecifications(value) {
  if (!isObject(value)) return false;
  return Object.entries(value).every(([key, val]) => {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(key)) return false;
    if (val === null) return false;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return true;
    if (Array.isArray(val)) return val.every(item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean');
    return false;
  });
}
function requireFields(body, fields) {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || (typeof body[f] === 'string' && !body[f].trim()));
  return missing;
}
module.exports = { isNonEmptyString, isSlug, isObject, isValidSpecifications, requireFields };
