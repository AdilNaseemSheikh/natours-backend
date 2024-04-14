const mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// set .env config before requiring the app
const app = require('./app');

// DB CONNECTION
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    // console.log(con.connections);
    console.log('DB connection successfull');
  })
  .catch((err) => console.log('err->', err));

const port = process.env.PORT;

// START THE SERVER
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
