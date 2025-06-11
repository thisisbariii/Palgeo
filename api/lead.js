import { buffer } from 'micro';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';

export const config = {
  api: {
    bodyParser: false, // Required to get raw body for HMAC
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Missing ELEVENLABS_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const buf = await buffer(req);
  const rawBody = buf.toString('utf8');
  const signature = req.headers['elevenlabs-signature'];

  if (!signature) {
    return res.status(401).json({ error: 'Missing signature header' });
  }

  // Create expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // Handle different signature formats (with or without sha256= prefix)
  const receivedSig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  const expectedSig = expectedSignature;

  // Use timing-safe comparison to prevent timing attacks
  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(receivedSig, 'hex'), 
      Buffer.from(expectedSig, 'hex')
    );
  } catch (error) {
    console.error('Signature comparison error:', error);
    return res.status(401).json({ error: 'Invalid signature format' });
  }

  if (!isValid) {
    console.error('Signature verification failed');
    console.error('Received:', receivedSig);
    console.error('Expected:', expectedSig);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const {
    name,
    email,
    phone,
    company,
    number_of_employees,
    industry_type,
  } = body;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: process.env.NOTIFICATION_EMAIL,
    from: process.env.FROM_EMAIL,
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
    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}