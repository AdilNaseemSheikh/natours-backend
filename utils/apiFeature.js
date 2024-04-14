const Tour = require("../models/tourModel");

class APIFeature {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1.1) exclude unnecessary keywords from query
    const queryObj = { ...this.queryString };

    const excludeFields = ['sort', 'fields', 'limit', 'page'];

    excludeFields.forEach((el) => delete queryObj[el]);

    // 1.2) enable gte etc. operators
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`,
    );

    this.query.find(JSON.parse(queryString));
  }

  sort() {
    let sortBy = '-createdAt'; // default sorting, - is for ascending
    if (this.queryString.sort) {
      sortBy = this.queryString.sort.replaceAll(',', ' ');
      // 'price ratingsAverage' if two has same price then it will be sorted according to their ratingsAverage
    }
    this.query.sort(sortBy);
  }

  limitFields() {
    let fields = '-__v'; //- is to exclude. By default, everything will be included except __v
    if (this.queryString.fields) {
      fields = this.queryString.fields.replaceAll(',', ' ');
    }
    this.query = this.query.select(fields);
  }

  async paginate() {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    if (this.queryString.page) {
      const toursCount = await Tour.countDocuments();
      if (skip >= toursCount) {
        throw new Error('This page does not exist');
      }
    }
  }
}

module.exports = APIFeature;
