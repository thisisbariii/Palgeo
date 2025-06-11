// import { buffer } from 'micro';
// import crypto from 'crypto';
// import sgMail from '@sendgrid/mail';

// export const config = {
//   api: {
//     bodyParser: false, // Required to get raw body for HMAC
//   },
// };

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Only POST requests allowed' });
//   }

//   const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
//   if (!secret) {
//     console.error('Missing ELEVENLABS_WEBHOOK_SECRET');
//     return res.status(500).json({ error: 'Server misconfiguration' });
//   }

//   const buf = await buffer(req);
//   const rawBody = buf.toString('utf8');
//   const signature = req.headers['elevenlabs-signature'];

//   if (!signature) {
//     return res.status(401).json({ error: 'Missing signature header' });
//   }

//   // Parse ElevenLabs signature format: t=timestamp,v0=signature
//   const sigParts = signature.split(',');
//   let timestamp = null;
//   let receivedSig = null;

//   for (const part of sigParts) {
//     const [key, value] = part.split('=');
//     if (key === 't') {
//       timestamp = value;
//     } else if (key === 'v0') {
//       receivedSig = value;
//     }
//   }

//   if (!timestamp || !receivedSig) {
//     console.error('Invalid signature format - missing timestamp or signature');
//     return res.status(401).json({ error: 'Invalid signature format' });
//   }

//   // Create the signed payload: timestamp + . + raw body
//   const signedPayload = timestamp + '.' + rawBody;

//   // Generate expected signature using the signed payload
//   const expectedSig = crypto
//     .createHmac('sha256', secret)
//     .update(signedPayload)
//     .digest('hex');

//   // Compare signatures
//   if (receivedSig !== expectedSig) {
//     console.error('Signature verification failed');
//     console.error('Received:', receivedSig);
//     console.error('Expected:', expectedSig);
//     console.error('Timestamp:', timestamp);
//     console.error('Signed payload:', signedPayload.substring(0, 100) + '...');
//     return res.status(401).json({ error: 'Invalid signature' });
//   }

//   // Optional: Check timestamp to prevent replay attacks (signature older than 5 minutes)
//   const currentTime = Math.floor(Date.now() / 1000);
//   const sigTimestamp = parseInt(timestamp);
//   if (currentTime - sigTimestamp > 300) { // 5 minutes
//     console.error('Signature too old');
//     return res.status(401).json({ error: 'Signature expired' });
//   }

//   let body;
//   try {
//     body = JSON.parse(rawBody);
//     console.log('Received webhook data:', body); // Debug log
//   } catch (err) {
//     console.error('JSON parse error:', err);
//     console.error('Raw body:', rawBody);
//     return res.status(400).json({ error: 'Invalid JSON' });
//   }

//   // Log the extracted fields for debugging
//   console.log('Webhook type:', body.type);
  
//   // Handle different webhook types
//   if (body.type === 'post_call_transcription') {
//     // Extract lead data from ElevenLabs conversation
//     const { data } = body;
//     const { analysis, metadata } = data;
    
//     // Try to extract lead info from data_collection_results
//     const dataCollection = analysis?.data_collection_results || {};
//     console.log('Data collection results:', dataCollection);
    
//     // Extract lead information (adjust field names based on your ElevenLabs agent configuration)
//     const name = dataCollection.name || dataCollection.full_name || dataCollection.customer_name;
//     const email = dataCollection.email || dataCollection.email_address;
//     const phone = dataCollection.phone || dataCollection.phone_number;
//     const company = dataCollection.company || dataCollection.company_name;
//     const number_of_employees = dataCollection.number_of_employees || dataCollection.employees;
//     const industry_type = dataCollection.industry_type || dataCollection.industry;
    
//     console.log('Extracted lead data:', {
//       name, email, phone, company, number_of_employees, industry_type
//     });
    
//     // If no data in data_collection_results, try to parse from transcript
//     if (!name && !email) {
//       console.log('No structured data found, parsing transcript...');
//       const transcript = data.transcript || [];
//       console.log('Full transcript:', JSON.stringify(transcript, null, 2));
      
//       const transcriptSummary = analysis?.transcript_summary || '';
//       console.log('Transcript summary:', transcriptSummary);
      
//       // You might need to implement text parsing here if the data isn't structured
//       // For now, we'll send the available information with full transcript
//     }
    
//     // Send email with available data
//     if (name || email || analysis?.transcript_summary) {
//       const msg = {
//         to: process.env.NOTIFICATION_EMAIL,
//         from: process.env.FROM_EMAIL,
//         subject: 'New Lead from ElevenLabs Call - Palgeo',
//         html: `
//           <h2>New Lead from ElevenLabs Call</h2>
//           <p><strong>Call Date:</strong> ${new Date(body.event_timestamp * 1000).toLocaleString()}</p>
//           <p><strong>Call Duration:</strong> ${metadata?.call_duration_secs || 'Unknown'} seconds</p>
//           <p><strong>Call Status:</strong> ${analysis?.call_successful || 'Unknown'}</p>
//           <hr>
//           <h3>Lead Information:</h3>
//           <p><strong>Name:</strong> ${name || 'Not provided'}</p>
//           <p><strong>Email:</strong> ${email || 'Not provided'}</p>
//           <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
//           <p><strong>Company:</strong> ${company || 'Not provided'}</p>
//           <p><strong>Employees:</strong> ${number_of_employees || 'Not provided'}</p>
//           <p><strong>Industry:</strong> ${industry_type || 'Not provided'}</p>
//           <hr>
//           <h3>Call Summary:</h3>
//           <p>${analysis?.transcript_summary || 'No summary available'}</p>
//           <hr>
//           <p><strong>Conversation ID:</strong> ${data.conversation_id}</p>
//           <p><strong>Agent ID:</strong> ${data.agent_id}</p>
//         `,
//       };

//       try {
//         await sgMail.send(msg);
//         return res.status(200).json({ 
//           message: 'Lead notification sent successfully',
//           type: body.type,
//           conversation_id: data.conversation_id
//         });
//       } catch (error) {
//         console.error('SendGrid error:', error.response?.body || error.message);
//         return res.status(500).json({ error: 'Failed to send email' });
//       }
//     } else {
//       return res.status(200).json({ 
//         message: 'Webhook received but no lead data found',
//         type: body.type 
//       });
//     }
//   } else {
//     // Handle direct tool calls with lead data or legacy format
//     console.log('Handling direct tool call or legacy format');
//     const {
//       name,
//       email,
//       phone,
//       company,
//       number_of_employees,
//       industry_type,
//     } = body;

//     console.log('Extracted fields:', {
//       name, email, phone, company, number_of_employees, industry_type
//     });

//     // Send email if we have at least name or email
//     if (name || email) {
//       const msg = {
//         to: process.env.NOTIFICATION_EMAIL,
//         from: process.env.FROM_EMAIL,
//         subject: 'New Lead Captured - Palgeo',
//         html: `
//           <h2>New Lead from Palgeo</h2>
//           <p><strong>Name:</strong> ${name || 'Not provided'}</p>
//           <p><strong>Email:</strong> ${email || 'Not provided'}</p>
//           <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
//           <p><strong>Company:</strong> ${company || 'Not provided'}</p>
//           <p><strong>Employees:</strong> ${number_of_employees || 'Not provided'}</p>
//           <p><strong>Industry:</strong> ${industry_type || 'Not provided'}</p>
//           <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
//         `,
//       };

//       try {
//         await sgMail.send(msg);
//         return res.status(200).json({ 
//           message: 'Lead captured successfully',
//           success: true 
//         });
//       } catch (error) {
//         console.error('SendGrid error:', error.response?.body || error.message);
//         return res.status(500).json({ error: 'Failed to send email' });
//       }
//     } else {
//         return res.status(400).json({ 
//           error: 'Missing required lead data (name or email)',
//           received_data: body
//         });
//       }
//     }
//   }

import { buffer } from 'micro';
import crypto from 'crypto';
const { Resend } = require('resend');

export const config = {
  api: {
    bodyParser: false,
  },
};

const resend = new Resend(process.env.RESEND_API_KEY);

// 🔒 HMAC Verification
function verifyHmacSignature(signature, rawBody, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');
  return signature === digest;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const buf = await buffer(req);
  const rawBody = buf.toString('utf8');
  const signature = req.headers['elevenlabs-signature'];

  if (!signature) {
    console.log('No signature found, treating as direct API call');
    return handleDirectApiCall(rawBody, res);
  }

  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!verifyHmacSignature(signature, rawBody, secret)) {
    console.error('Invalid HMAC signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  return handleElevenLabsWebhook(rawBody, res);
}

async function handleElevenLabsWebhook(rawBody, res) {
  let body;
  try {
    body = JSON.parse(rawBody);
    console.log('Received ElevenLabs webhook:', JSON.stringify(body, null, 2));
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (body.type === 'post_call_transcription') {
    const leadData = extractLeadFromTranscript(body.data);
    if (leadData) {
      const success = await sendLeadEmail(leadData, body.data);
      return success
        ? res.status(200).json({ message: 'Lead email sent', leadData })
        : res.status(500).json({ error: 'Failed to send email' });
    } else {
      return res.status(200).json({ message: 'No lead found in transcript' });
    }
  }

  return res.status(200).json({ message: 'Webhook received' });
}

async function handleDirectApiCall(rawBody, res) {
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { name, email, phone, company, number_of_employees, industry_type } = body;
  if (name || email) {
    const leadData = { name, email, phone, company, number_of_employees, industry_type };
    const success = await sendLeadEmail(leadData);
    return success
      ? res.status(200).json({ message: 'Lead email sent (API)', leadData })
      : res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(400).json({ error: 'Missing required lead data' });
}

function extractLeadFromTranscript(data) {
  const results = data.analysis?.data_collection_results || {};
  let lead = {
    name: results.name || results.full_name || results.customer_name,
    email: results.email || results.email_address,
    phone: results.phone || results.phone_number,
    company: results.company || results.company_name,
    number_of_employees: results.number_of_employees || results.employees,
    industry_type: results.industry_type || results.industry
  };

  if (!lead.name && !lead.email && data.transcript) {
    for (const entry of data.transcript) {
      if (entry.tool_calls?.length) {
        for (const call of entry.tool_calls) {
          if (call.tool_name === 'Send_Lead_to_Palgeo' && call.params_as_json) {
            try {
              const params = JSON.parse(call.params_as_json);
              return {
                name: params.name,
                email: params.email,
                phone: params.phone,
                company: params.company,
                number_of_employees: params.number_of_employees,
                industry_type: params.industry_type
              };
            } catch {}
          }
        }
      }

      if (entry.role === 'user' && entry.message) {
        const msg = entry.message;
        lead.email = lead.email || msg.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0];
        lead.phone = lead.phone || msg.match(/\d{10,}/)?.[0];
        lead.company = lead.company || msg.match(/company\s*[-:]\s*(\w+)/i)?.[1];
        lead.number_of_employees = lead.number_of_employees || msg.match(/employees\s*[-:]\s*(\d+)/i)?.[1];
        lead.industry_type = lead.industry_type || msg.match(/industry\s*[-:]\s*(\w+)/i)?.[1];

        if (!lead.name) {
          const guess = msg.split(' ').find(w => w.length > 2 && !w.includes('@') && isNaN(w));
          if (guess) lead.name = guess;
        }
      }
    }
  }

  return lead.name || lead.email ? lead : null;
}

async function sendLeadEmail(lead, callData = null) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Palgeo Lead Bot <skbad911@gmail.com>',
      to: [process.env.NOTIFICATION_EMAIL],
      subject: '🎯 New Lead from ElevenLabs',
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>🎯 New Lead Received</h2>
          <ul>
            <li><b>Name:</b> ${lead.name || 'N/A'}</li>
            <li><b>Email:</b> ${lead.email || 'N/A'}</li>
            <li><b>Phone:</b> ${lead.phone || 'N/A'}</li>
            <li><b>Company:</b> ${lead.company || 'N/A'}</li>
            <li><b>Employees:</b> ${lead.number_of_employees || 'N/A'}</li>
            <li><b>Industry:</b> ${lead.industry_type || 'N/A'}</li>
          </ul>
          ${callData ? `
            <hr>
            <h3>Call Summary</h3>
            <p><b>Time:</b> ${new Date(callData.metadata?.start_time_unix_secs * 1000).toLocaleString()}</p>
            <p><b>Duration:</b> ${callData.metadata?.call_duration_secs || 'N/A'} seconds</p>
            <p><b>Transcript Summary:</b><br>${callData.analysis?.transcript_summary || 'No summary'}</p>
            <p><b>Conversation ID:</b> ${callData.conversation_id}</p>
          ` : ''}
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('sendLeadEmail error:', err);
    return false;
  }
}
