const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
);

exports.getAllTours = (req, res) => {
  res.status(200).send({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: { tours },
  });
};

exports.getTour = (req, res) => {
  const id = +req.params.id;

  const tour = tours.find((el) => el.id === id);

  if (!tour)
    res.status(404).send({
      status: 'fail',
      message: 'Invalid ID',
    });
  else
    res.status(200).send({
      status: 'success',
      data: { tour },
    });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = { ...req.body, id: newId };
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).send({ status: 'success', data: { tour: newTour } });
    }
  );
};

exports.deleteTour = (req, res) => {
  const id = +req.params.id;

  if (id >= tours.length) {
    res.status(404).send({
      status: 'fail',
      message: 'Invalid ID',
    });
  } else {
    res.status(204).send({
      status: 'success',
      data: null,
    });
  }
};

exports.updateTour = (req, res) => {
  const id = +req.params.id;

  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    res.status(404).send({
      status: 'fail',
      message: 'Invalid ID',
    });
  } else {
    const updatedTour = { ...tour };
    Object.entries(req.body).forEach(([key, value]) => {
      updatedTour[key] = value;
    });
    res.status(200).send({
      status: 'success',
      data: { tour: updatedTour },
    });
  }
};
