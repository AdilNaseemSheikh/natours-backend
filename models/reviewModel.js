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
  console.log('stats -> ', stats);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};

// in .pre, the current review is not saved in collection yet. So we use post
reviewSchema.post('save', function () {
  // this points to the current document that is being saved
  // Review.calcAverageRatings(this._id);
  // Review is not created yet, this.constructor is same
  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
