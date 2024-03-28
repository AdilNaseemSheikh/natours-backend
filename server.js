const app = require('./app');

// 4) START THE SERVER

const port = 8000;

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
