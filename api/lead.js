// /api/lead.js

import crypto from 'crypto';
import { buffer } from 'micro';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const config = {
  api: {
    bodyParser: false, // IMPORTANT: we need raw body for HMAC verification
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const rawBody = (await buffer(req)).toString('utf8');
  const signature = req.headers['elevenlabs-signature'];
  const secret = process.env.ELEVENLABS_HMAC_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = JSON.parse(rawBody);
  const { name, email, phone, company, number_of_employees, industry_type } = body;

  const msg = {
    to: 'skbad911@gmail.com',
    from: 'noreply@yourdomain.com', // must match your verified sender domain in SendGrid
    subject: 'New Lead Captured - Palgeo',
    html: `
      <h2>New Lead from Palgeo</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Employees:</strong> ${number_of_employees}</p>
      <p><strong>Industry:</strong> ${industry_type}</p>
    `,
  };

  try {
    await sgMail.send(msg);
    return res.status(200).json({ message: 'Email sent' });
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    return res.status(500).json({ error: 'Email failed' });
  }
}
