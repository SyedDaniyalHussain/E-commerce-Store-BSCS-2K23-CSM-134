const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const env = require('../config/env');
const { errorResponse } = require('../utils/errors');
const { isNonEmptyString } = require('../utils/validation');
const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) return errorResponse(res, 400, 'VALIDATION_ERROR', 'Email and password are required.');
    const { rows } = await pool.query('SELECT id,name,email,password_hash,role FROM users WHERE email=$1', [email.trim()]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    const user = rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
    res.json({ data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (e) { next(e); }
});
module.exports = router;
