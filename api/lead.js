// /api/lead.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET; // ✅ This matches your .env file
  if (!secret) {
    console.error('ELEVENLABS_WEBHOOK_SECRET is undefined');
    return res.status(500).json({ error: 'Server misconfiguration: missing HMAC secret' });
  }

  const signature = req.headers['elevenlabs-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const crypto = await import('crypto');

  let expectedSignature;
  try {
    expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
  } catch (err) {
    console.error('HMAC computation error:', err);
    return res.status(500).json({ error: 'Failed to verify signature' });
  }

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const {
    name,
    email,
    phone,
    company,
    number_of_employees,
    industry_type,
  } = req.body;

  const sgMail = (await import('@sendgrid/mail')).default;
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
