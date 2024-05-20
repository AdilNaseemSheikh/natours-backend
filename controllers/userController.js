const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const sharp = require('sharp');

const multer = require('multer');
// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     // callback is same as next, but it is not from Express.js
//     callback(null, 'public/img/users'); // calling with null means no error
//   },
//   filename: (req, file, callback) => {
//     // mimetype: 'image/png',
//     const ext = file.mimetype.split('/')[1];

//     // user-userId-timestamp.extension, to give each file a unique name
//     callback(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
  // test if uploaded file is image
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(
      new AppError('Not an image. Please upload only images', 400),
      false,
    );
  }
};

const upload = multer({ fileFilter: multerFilter, storage: multerStorage });

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};
  allowedFields.forEach((field) => {
    if (obj[field]) filteredObj[field] = obj[field];
  });
  return filteredObj;
};

// upload.single('photo') means pick single file from field 'photo',
// put it in specified destination, add some info on req object & call next middleware
exports.uploadUserPhoto = upload.single('photo');

// to resize the image, to make it less in size and make it square
exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  // put it on request and use it in next middleware
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500) // height, width
    .toFormat('jpeg') // change extension
    .jpeg({ quality: 90 }) // reduce the quality
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(User);
// do not update password here
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Please use /signup route.',
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
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
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
