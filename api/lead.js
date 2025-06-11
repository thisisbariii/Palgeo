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

  // Parse ElevenLabs signature format: t=timestamp,v0=signature
  const sigParts = signature.split(',');
  let timestamp = null;
  let receivedSig = null;

  for (const part of sigParts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = value;
    } else if (key === 'v0') {
      receivedSig = value;
    }
  }

  if (!timestamp || !receivedSig) {
    console.error('Invalid signature format - missing timestamp or signature');
    return res.status(401).json({ error: 'Invalid signature format' });
  }

  // Create the signed payload: timestamp + . + raw body
  const signedPayload = timestamp + '.' + rawBody;

  // Generate expected signature using the signed payload
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Compare signatures
  if (receivedSig !== expectedSig) {
    console.error('Signature verification failed');
    console.error('Received:', receivedSig);
    console.error('Expected:', expectedSig);
    console.error('Timestamp:', timestamp);
    console.error('Signed payload:', signedPayload.substring(0, 100) + '...');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Optional: Check timestamp to prevent replay attacks (signature older than 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  const sigTimestamp = parseInt(timestamp);
  if (currentTime - sigTimestamp > 300) { // 5 minutes
    console.error('Signature too old');
    return res.status(401).json({ error: 'Signature expired' });
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