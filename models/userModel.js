const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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

// this is instance method, available on all documents of this collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
