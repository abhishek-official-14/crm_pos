const express = require('express');
const { login, register, seedRoles } = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validator');

const router = express.Router();

router.post('/seed-roles', seedRoles);
router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);

module.exports = router;
