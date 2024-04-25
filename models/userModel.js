const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); //builtin node module

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide your email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // this only Works on CREATE & SAVE
      validator: function (confirmPassword) {
        return confirmPassword === this.password;
      },
      message: 'Confirm password should be same as password',
    },
  },
  passwordChangedAt: Date,
  passwrodResetToken: String,
  passwrodResetExpire: Date,
});

userSchema.pre('save', async function (next) {
  // when updating, if password field is not updated then do not encrypt old password again
  if (!this.isModified('password')) return;

  //second param is salt value, default is 10. the higher the value, the better encryption
  // not too high so it takes long time to encrypt
  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined; //do not store it in db

  next();
});

userSchema.pre('save', async function (next) {
  // if password is not modified & doc is newly created then also dont update the passwordChangedAt
  if (!this.isModified('password') || this.isNew) return next();
  // passwordChangedAt should be less than token issue time otherwise protect will not work
  // cuz sometime due to slow saving in db may cause passwordChangedAt greater than token issue time
  // setting passwordChangedAt 1 second in the past will ensure that token issued time is greater than passwordChangedAt
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// this is instance method, available on all documents of this collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  // in instance method, this points to the current document
  if (this.passwordChangedAt) {
    // convert date into timestamp to be compared with jwttimestamp
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimeStamp; // password change happened after token was issued
  }
  // false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // do not store plain token in db but also no need to involve bcrypt to encrypt it,
  // just apply simple encryption using builtin crypto module

  this.passwrodResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log(
    { plainToken: resetToken },
    { passwrodResetToken: this.passwrodResetToken },
  );

  // token will expire after 10 mins
  this.passwrodResetExpire = Date.now() + 10 * 60 * 1000;

  // return plain token to be used in mail
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
