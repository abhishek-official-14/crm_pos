const bcrypt = require('bcrypt');
const createHttpError = require('http-errors');
const Role = require('../models/role.model');
const User = require('../models/user.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { signToken } = require('../utils/jwt');

/**
 * Register user with hashed password and role relation.
 */
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role = 'STAFF' } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw createHttpError(409, 'Email already exists');

  const roleDoc = await Role.findOne({ name: role });
  if (!roleDoc) throw createHttpError(400, 'Role not configured in database');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role: roleDoc._id
  });

  res.status(201).json({ success: true, data: { id: user._id, email: user.email } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password').populate('role');
  if (!user) throw createHttpError(401, 'Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw createHttpError(401, 'Invalid credentials');

  const token = signToken({ id: user._id, role: user.role.name });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.name
      }
    }
  });
});

const seedRoles = asyncHandler(async (req, res) => {
  const roles = ['ADMIN', 'STAFF'];
  await Promise.all(
    roles.map((name) =>
      Role.updateOne({ name }, { $setOnInsert: { name, description: `${name} role` } }, { upsert: true })
    )
  );

  res.json({ success: true, message: 'Roles seeded' });
});

module.exports = { register, login, seedRoles };
