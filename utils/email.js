const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Adil Naseem <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // sendgrid
      return nodemailer.createTransport({
        // no need to specify host, portname etc. nodemailer already knows sendgrid
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Actually send the email
  async send(template, subject) {
    // 1) Render the HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: htmlToText.htmlToText(html),
    };

    // 3) Create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    try {
      await this.send('welcome', 'Welcome to the Natours family');
    } catch (error) {
      console.log(error);
    }
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for next 10 min)',
    );
  }
};

// const sendEmail = async (options) => {
//   // 2) Define email options
//   const mailOptions = {
//     from: 'Adil Naseem <test@helloworld.org>',
//     to: options.to,
//     subject: options.subject,
//     text: options.message,
//   };

//   // 3) Actually send the email
//   await transporter.sendMail(mailOptions);
// };

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
