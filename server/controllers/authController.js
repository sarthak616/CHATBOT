const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    logger.info(`New user registered: ${email}`);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    user.password = undefined;

    logger.info(`User logged in: ${email}`);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { defaultMode, theme } = req.body;
    const update = {};
    if (defaultMode) update['preferences.defaultMode'] = defaultMode;
    if (theme) update['preferences.theme'] = theme;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true }
    );
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
