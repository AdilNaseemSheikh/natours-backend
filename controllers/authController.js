const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

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
    passwordChangedAt: req.body.passwordChangedAt || undefined,
    role: req.body.role || undefined,
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

  const token = signToken(user._id);

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

  // 4) Check if user has changed his password after the token was issued
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

exports.restrictTo = (roles = []) => {
  return catchAsync(async (req, res, next) => {
    // req.user is available as it was set in previous middleware
    if (!roles.includes(req.user.role)) {
      next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }
    next();
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on provided email
  const user = await User.findOne({ email: req.body.email });
  if (!user) next(new AppError('No user found with this email.', 404));

  // 2) generate random token
  const resetToken = await user.createPasswordResetToken();
  // we are trying to save a document but we are not providing mandatory data
  // So, we need to turn the validator off
  await user.save({ validateBeforeSave: false }); //data is added on user as properties, now we save it

  // 3) send this token to users email
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your password and confirm password to :${resetUrl}.\n
  If you didn't forgot you password, you can safely ignore this email.`;
  console.log(resetUrl);

  // we want to do some more than just sending error message to client. That's why trycatch instead of next(new AppError)
  try {
    await sendEmail({
      subject: 'Your password reset token (valid for next 10 min)',
      message,
      to: user.email,
    });
  } catch (err) {
    user.passwrodResetToken = undefined;
    user.passwrodResetExpire = undefined;
    await user.save({ validateBeforeSave: false }); //data is modified on user, now we save it
    next(
      new AppError(
        'There was an error sending email. Please try again later!',
        500,
      ),
    );
    return;
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token) // --> /:token
    .digest('hex');

  // 2) if user found and token is not expired, set new password
  const user = await User.findOne({
    passwrodResetToken: hashedToken,
    passwrodResetExpire: { $gt: Date.now() },
  }); // where token === hashedtoken and expire date is gt now

  if (!user) {
    next(new AppError('Token is invalid or has already expired', 400));
    return;
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwrodResetToken = undefined;
  user.passwrodResetExpire = undefined;
  await user.save(); // we use save cuz we want to run the validators. update do not runs validators

  // 3) update passwordChangedAt
  // user.passwordChangedAt = Date.now();

  // 4) log the user in
  const token = signToken(user._id);

  res.status(200).json({ status: 'success', token });
});
