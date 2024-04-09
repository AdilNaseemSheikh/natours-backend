const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// set .env config before requiring the app
const app = require('./app');

// 4) START THE SERVER

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
