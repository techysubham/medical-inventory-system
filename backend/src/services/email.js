import nodemailer from 'nodemailer';

let transporter;

// Initialize transporter based on provider
if (process.env.EMAIL_PROVIDER === 'sendgrid') {
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
} else if (process.env.EMAIL_PROVIDER === 'mailgun') {
  transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 587,
    auth: {
      user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
      pass: process.env.MAILGUN_API_KEY,
    },
  });
} else {
  // Fallback to mock for development
  transporter = {
    sendMail: async (options) => {
      console.log('Mock email:', options);
      return Promise.resolve();
    },
  };
}

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email',
    html: `
      <h2>Welcome to Medical Inventory Management</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

export const sendInvoiceEmail = async (email, invoiceData) => {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Invoice ${invoiceData.invoiceNumber}`,
    html: `
      <h2>Invoice ${invoiceData.invoiceNumber}</h2>
      <p>Total: $${invoiceData.totalAmount}</p>
      <p>Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}</p>
    `,
  });
};
