const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};
  allowedFields.forEach((field) => {
    if (obj[field]) filteredObj[field] = obj[field];
  });
  return filteredObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find({});

  // SEND RESPONSE
  res.status(200).send({
    status: 'success',
    requestedAt: req.requestTime,
    results: users.length,
    data: { users },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not ready yet.',
  });
};

exports.getUser = (req, res) => {
  const id = +req.params.id;
  res.status(500).json({
    status: 'error',
    message: 'This route is not ready yet.',
  });
};

exports.updateUser = (req, res) => {
  const id = +req.params.id;
  res.status(500).json({
    status: 'error',
    message: 'This route is not ready yet.',
  });
};

exports.deleteUser = (req, res) => {
  const id = +req.params.id;
  res.status(500).json({
    status: 'error',
    message: 'This route is not ready yet.',
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user tries to update the password here
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }

  // 2) update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  console.log(filteredBody);
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    runValidators: true,
    new: true, // return new updated user
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: 'success', data: null });
});
