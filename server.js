const mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION. Shutting down...');
  console.log('💣', err, '💣');

  process.exit(1);
});

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
    useUnifiedTopology: true,
  })
  .then((con) => {
    // console.log(con.connections);
    console.log('DB connection successfull');
  });

const port = process.env.PORT;

// START THE SERVER
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Global unhandle rejection.
// If there is unhandled rejection anywhere in our app, it will be caught here

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION. Shutting down...');
  console.log('💣', err, '💣');
  server.close(() => {
    // give server some time to finishe its ongoing request and then exit the application
    // exit the application
    process.exit(1);
  });
});

// heroku every 24 hrs shut down our application by sending SIGTERM signal
// we listen to this signal and quit server gracefully(wait for all pending requests to finish)
process.on('SIGTERM', (err) => {
  console.log('👋 SIGTERM RECEIVED. Shutting down...');

  server.close(() => {
    console.log('Process Terminated.');
  });
});
