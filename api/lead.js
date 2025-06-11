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
    console.log('Received webhook data:', body); // Debug log
  } catch (err) {
    console.error('JSON parse error:', err);
    console.error('Raw body:', rawBody);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Log the extracted fields for debugging
  console.log('Webhook type:', body.type);
  
  // Handle different webhook types
  if (body.type === 'post_call_transcription') {
    // Extract lead data from ElevenLabs conversation
    const { data } = body;
    const { analysis, metadata } = data;
    
    // Try to extract lead info from data_collection_results
    const dataCollection = analysis?.data_collection_results || {};
    console.log('Data collection results:', dataCollection);
    
    // Extract lead information (adjust field names based on your ElevenLabs agent configuration)
    const name = dataCollection.name || dataCollection.full_name || dataCollection.customer_name;
    const email = dataCollection.email || dataCollection.email_address;
    const phone = dataCollection.phone || dataCollection.phone_number;
    const company = dataCollection.company || dataCollection.company_name;
    const number_of_employees = dataCollection.number_of_employees || dataCollection.employees;
    const industry_type = dataCollection.industry_type || dataCollection.industry;
    
    console.log('Extracted lead data:', {
      name, email, phone, company, number_of_employees, industry_type
    });
    
    // If no data in data_collection_results, try to parse from transcript
    if (!name && !email) {
      console.log('No structured data found, parsing transcript...');
      const transcript = data.transcript || [];
      console.log('Full transcript:', JSON.stringify(transcript, null, 2));
      
      const transcriptSummary = analysis?.transcript_summary || '';
      console.log('Transcript summary:', transcriptSummary);
      
      // You might need to implement text parsing here if the data isn't structured
      // For now, we'll send the available information with full transcript
    }
    
    // Send email with available data
    if (name || email || analysis?.transcript_summary) {
      const msg = {
        to: process.env.NOTIFICATION_EMAIL,
        from: process.env.FROM_EMAIL,
        subject: 'New Lead from ElevenLabs Call - Palgeo',
        html: `
          <h2>New Lead from ElevenLabs Call</h2>
          <p><strong>Call Date:</strong> ${new Date(body.event_timestamp * 1000).toLocaleString()}</p>
          <p><strong>Call Duration:</strong> ${metadata?.call_duration_secs || 'Unknown'} seconds</p>
          <p><strong>Call Status:</strong> ${analysis?.call_successful || 'Unknown'}</p>
          <hr>
          <h3>Lead Information:</h3>
          <p><strong>Name:</strong> ${name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${email || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Company:</strong> ${company || 'Not provided'}</p>
          <p><strong>Employees:</strong> ${number_of_employees || 'Not provided'}</p>
          <p><strong>Industry:</strong> ${industry_type || 'Not provided'}</p>
          <hr>
          <h3>Call Summary:</h3>
          <p>${analysis?.transcript_summary || 'No summary available'}</p>
          <hr>
          <p><strong>Conversation ID:</strong> ${data.conversation_id}</p>
          <p><strong>Agent ID:</strong> ${data.agent_id}</p>
        `,
      };

      try {
        await sgMail.send(msg);
        return res.status(200).json({ 
          message: 'Lead notification sent successfully',
          type: body.type,
          conversation_id: data.conversation_id
        });
      } catch (error) {
        console.error('SendGrid error:', error.response?.body || error.message);
        return res.status(500).json({ error: 'Failed to send email' });
      }
    } else {
      return res.status(200).json({ 
        message: 'Webhook received but no lead data found',
        type: body.type 
      });
    }
  } else {
    // Handle direct tool calls with lead data or legacy format
    console.log('Handling direct tool call or legacy format');
    const {
      name,
      email,
      phone,
      company,
      number_of_employees,
      industry_type,
    } = body;

    console.log('Extracted fields:', {
      name, email, phone, company, number_of_employees, industry_type
    });

    // Send email if we have at least name or email
    if (name || email) {
      const msg = {
        to: process.env.NOTIFICATION_EMAIL,
        from: process.env.FROM_EMAIL,
        subject: 'New Lead Captured - Palgeo',
        html: `
          <h2>New Lead from Palgeo</h2>
          <p><strong>Name:</strong> ${name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${email || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Company:</strong> ${company || 'Not provided'}</p>
          <p><strong>Employees:</strong> ${number_of_employees || 'Not provided'}</p>
          <p><strong>Industry:</strong> ${industry_type || 'Not provided'}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      };

      try {
        await sgMail.send(msg);
        return res.status(200).json({ 
          message: 'Lead captured successfully',
          success: true 
        });
      } catch (error) {
        console.error('SendGrid error:', error.response?.body || error.message);
        return res.status(500).json({ error: 'Failed to send email' });
      }
    } else {
        return res.status(400).json({ 
          error: 'Missing required lead data (name or email)',
          received_data: body
        });
      }
    }
  }