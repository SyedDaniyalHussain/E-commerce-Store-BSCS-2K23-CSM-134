const express = require('express');
const pool = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { errorResponse } = require('../utils/errors');
const { isNonEmptyString, isSlug } = require('../utils/validation');
const router = express.Router();
router.use(authenticate, requireAdmin);

async function hasDescendant(id, candidateParentId) {
  let current = candidateParentId;
  const seen = new Set();
  while (current !== null && current !== undefined) {
    if (seen.has(current)) return true;
    seen.add(current);
    if (Number(current) === Number(id)) return true;
    const { rows } = await pool.query('SELECT parent_id FROM categories WHERE id=$1', [current]);
    if (!rows.length) return false;
    current = rows[0].parent_id;
  }
  return false;
}

router.get('/', async (req,res,next) => {
  try {
    const { rows } = await pool.query('SELECT id,parent_id,name,description,slug,active,created_at,updated_at FROM categories ORDER BY name');
    res.json({ data: rows });
  } catch(e){ next(e); }
});

router.post('/', async (req,res,next) => {
  try {
    const { name, slug, description = null, parent_id = null, active = true } = req.body || {};
    if (!isNonEmptyString(name) || !isSlug(slug)) return errorResponse(res,400,'VALIDATION_ERROR','Name and a valid slug are required.');
    if (parent_id !== null && parent_id !== undefined) {
      const p = await pool.query('SELECT id FROM categories WHERE id=$1',[parent_id]);
      if (!p.rows.length) return errorResponse(res,400,'INVALID_PARENT','Parent category does not exist.');
    }
    const { rows } = await pool.query('INSERT INTO categories(name,slug,description,parent_id,active) VALUES($1,$2,$3,$4,$5) RETURNING *',[name.trim(),slug,description,parent_id,active]);
    res.status(201).json({ data: rows[0] });
  } catch(e){ next(e); }
});

router.patch('/:id', async (req,res,next) => {
  try {
    const id = Number(req.params.id); if (!Number.isInteger(id)) return errorResponse(res,400,'INVALID_ID','Invalid category id.');
    const existing = await pool.query('SELECT * FROM categories WHERE id=$1',[id]);
    if (!existing.rows.length) return errorResponse(res,404,'NOT_FOUND','Category not found.');
    const current = existing.rows[0];
    const { name=current.name, slug=current.slug, description=current.description, parent_id=current.parent_id, active=current.active } = req.body || {};
    if (!isNonEmptyString(name) || !isSlug(slug)) return errorResponse(res,400,'VALIDATION_ERROR','Name and a valid slug are required.');
    if (parent_id !== null && parent_id !== undefined) {
      const p = await pool.query('SELECT id FROM categories WHERE id=$1',[parent_id]);
      if (!p.rows.length) return errorResponse(res,400,'INVALID_PARENT','Parent category does not exist.');
      if (await hasDescendant(id,parent_id)) return errorResponse(res,400,'CATEGORY_CYCLE','Category cannot become its own ancestor.');
    }
    const { rows } = await pool.query('UPDATE categories SET name=$1,slug=$2,description=$3,parent_id=$4,active=$5,updated_at=NOW() WHERE id=$6 RETURNING *',[name.trim(),slug,description,parent_id,active,id]);
    res.json({ data: rows[0] });
  } catch(e){ next(e); }
});

router.delete('/:id', async (req,res,next) => {
  try {
    const { rows } = await pool.query('UPDATE categories SET active=false,updated_at=NOW() WHERE id=$1 RETURNING *',[req.params.id]);
    if (!rows.length) return errorResponse(res,404,'NOT_FOUND','Category not found.');
    res.json({ data: rows[0], message:'Category deactivated.' });
  } catch(e){ next(e); }
});
module.exports = router;
