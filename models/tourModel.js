const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
// const validator = require('validator');

// SCHEMA
const tourSchema = mongoose.Schema(
  {
    // rating: Number,

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5.0'],
      // setter function receives incomming value and returns modified value which is stored
      set: (val) => Math.round(val * 10) / 10, // 4.6666 * 10 => 46.7 / 10 => 4.7
    }, //schema type options
    ratingsQuantity: { type: Number, default: 0 },
    // message to be displayed when not provided the value of required field
    price: { type: Number, required: [true, 'A tour must have a name'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this points to current doc only while creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be less than actual price',
      },
    },
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be easy, medium or difficult',
      },
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxLength: [
        40,
        'A tour name must have less than or equal to 40 characters',
      ],
      minLength: [10, 'A tour name must have at least 40 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    description: { type: String, trim: true },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    }, // trim only works for type: String to remove white spaces
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    // Array of String
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),

      // do not return this field in response. It is here to be used internally(sorting etc.)
      select: false,
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },

    startLocation: {
      // thats how we define GeoJSON(Geo spatial JSON) in Mongodb
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // embeding
    // guides: Array,
    // refrencing
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  // schema options
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 }); // 1 means sort in ascending order
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // to tell mongodb that this data will contain earth coordinates

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual Populate, it will keep array of review ids on tour without persisting it in db
// virtual populate is useful when we dont have parent referencing to child
// but we want all the child associated with this parent
tourSchema.virtual('reviews', {
  // find 'tour' field in 'Review' model whose value is '_id' in current model
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE (pre): runs before .save() & .create()
tourSchema.pre('save', function (next) {
  // in save middleware, this points to the currently processed document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// embeding guides
// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// DOCUMENT MIDDLEWARE (post): runs after .save() & .create()
// tourSchema.post('save', function (doc, next) {
//   // instead of this keyword, it has the saved doc
//   next();
// });

// QUERY MIDDLEWARE (pre)
// tourSchema.pre('find', function () {
tourSchema.pre(/^find/, function (next) {
  // run this middleware not only for find, but every command starts with find (find, findOne, findById, findByIdAndUpdate etc.)
  // in query middleware, this points to the query object & we can call query methods on it
  this.start = Date.now();
  this.find({ secretTour: { $ne: true } }); // find tour where secretTour!==true
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides', // replace guides with whole object which the refer to
    select: '-__v -passwordChangedAt', // exclude while populating
  });
  next();
});

// QUERY MIDDLEWARE (post)
// tourSchema.pre('find', function () {
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start}`);
  next();
});

// QUERY MIDDLEWARE (pre)

// tourSchema.pre('aggregate', function (next) {
//   // this points to the current aggregation object
//   this._pipeline.unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

// MODEL created out of schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
