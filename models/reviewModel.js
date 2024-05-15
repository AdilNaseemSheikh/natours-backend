const mongoose = require('mongoose');
const Tour = require('../models/tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review cannot be empty!'] },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now() },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// static methods, can be called directly on models
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // in static model, this points to the Model on which function is being called
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, // tour is field in Review model
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats?.[0]?.nRating || 0,
    ratingsAverage: stats?.[0]?.avgRating || 4.5,
  });
};

// 1 user can write only 1 review for 1 tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// in .pre, the current review is not saved in collection yet. So we use post
reviewSchema.post('save', function () {
  // this points to the current document that is being saved
  // Review.calcAverageRatings(this._id);
  // Review is not created yet, this.constructor is same
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate & findByIdAndDelete are actually findONeAndUpdate and Delete's shorthand with id param provided
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // executing query returns current processed document
  this.r = await this.findOne(); // this is the way to pass data from .pre to .post
  // we pass it from pre to post. Cuz in post we dont have access to query and without query, no current doc
  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  // we pass tour from .pre and update rating in post cuz
  // in pre, we wouldnt have updated data and post is called after updation and deletion (POST)
  // but in the case of deletion, we cannot get access to deleted doc in post
  // , so, we catch it in pre and pass it to post
  this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
