const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: `${process.env.JWT_EXPIRES_IN}`,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    // passwordChangedAt: req.body.passwordChangedAt
    //   ? req.body.passwordChangedAt
    //   : '',
  });

  // we can simply use user's id as payload in signing JWT
  // secret needs to be a random string at least 32 char long
  const token = signToken(newUser._id);

  res.status(201).json({ status: 'success', token, data: { user: newUser } });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 1) check if user exists
  // user will not have password as it is restricted through user model, +password will solve this
  const user = await User.findOne({ email: email }).select('+password');

  // if !user is true, the user.password will not be read & we will not get error reading password of undefined
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const token = signToken(user.id);

  res.status(200).json({ status: 'success', token });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Get token and check if its there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next(
      new AppError('You are not logged in. Please login to get access', 401),
    );
    return;
  }

  // 2) Verify token if it is valid, not being modified
  // we promisify the verify and then call it with its params
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user who is requesting still exists in db
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    next(
      new AppError(
        'The user belonging to this token does no longer exists.',
        401,
      ),
    );
    return;
  }

  // 4) Check if user change password after the token was issued
  const isChanged = await currentUser.changedPasswordAfter(decoded.iat);
  if (isChanged) {
    next(
      new AppError('User recently changed password! Please login again.', 401),
    );
    return;
  }

  // if code is reached at this point, no error occur in any of the above case, so execute next middleware
  req.user = currentUser;
  next();
});
