const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define email options
  const mailOptions = {
    from: 'Adil Naseem <test@helloworld.org>',
    to: options.to,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

/*
const transporter = nodemailer.createTransport({
    // using gmail in production app is not a good idea unless its a private app like portfolio.
    // There is a limit of 500 mails/day and you can be marked as spammer
    service: 'Gmail', // gmail, yahoo etc
    auth: {
      user: 'users main',
      pass: 'users password',
      // then activate less-secure-app in your gmail account.
    },
  });

  */
