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

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

  return handleElevenLabsWebhook(rawBody, res);
}

async function handleElevenLabsWebhook(rawBody, res) {
  let body;
  try {
    body = JSON.parse(rawBody);
    console.log('Received ElevenLabs webhook:', JSON.stringify(body, null, 2));
  } catch (err) {
    console.error('JSON parse error:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (body.type === 'post_call_transcription') {
    const leadData = extractLeadFromTranscript(body.data);
    
    if (leadData) {
      const success = await sendLeadEmail(leadData, body.data);
      if (success) {
        return res.status(200).json({ 
          message: 'Lead notification sent successfully',
          type: body.type,
          conversation_id: body.data.conversation_id,
          leadData
        });
      } else {
        return res.status(500).json({ error: 'Failed to send email' });
      }
    } else {
      return res.status(200).json({ 
        message: 'Webhook received but no lead data found',
        type: body.type 
      });
    }
  }

  return res.status(200).json({ message: 'Webhook received' });
}

async function handleDirectApiCall(rawBody, res) {
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error('JSON parse error:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { name, email, phone, company, number_of_employees, industry_type } = body;

  if (name || email) {
    const leadData = { name, email, phone, company, number_of_employees, industry_type };
    const success = await sendLeadEmail(leadData);
    
    if (success) {
      return res.status(200).json({ message: 'Lead captured successfully', success: true });
    } else {
      return res.status(500).json({ error: 'Failed to send email' });
    }
  } else {
    return res.status(400).json({ 
      error: 'Missing required lead data (name or email)',
      received_data: body
    });
  }
}

function extractLeadFromTranscript(data) {
  const dataCollection = data.analysis?.data_collection_results || {};
  
  let leadData = {
    name: dataCollection.name || dataCollection.full_name || dataCollection.customer_name,
    email: dataCollection.email || dataCollection.email_address,
    phone: dataCollection.phone || dataCollection.phone_number,
    company: dataCollection.company || dataCollection.company_name,
    number_of_employees: dataCollection.number_of_employees || dataCollection.employees,
    industry_type: dataCollection.industry_type || dataCollection.industry
  };

  if (!leadData.name && !leadData.email && data.transcript) {
    console.log('Parsing lead data from transcript...');
    
    for (const entry of data.transcript) {
      if (entry.tool_calls && entry.tool_calls.length > 0) {
        for (const toolCall of entry.tool_calls) {
          if (toolCall.tool_name === 'Send_Lead_to_Palgeo' && toolCall.params_as_json) {
            try {
              const params = JSON.parse(toolCall.params_as_json);
              console.log('Found lead data in tool call:', params);
              leadData = {
                name: params.name,
                email: params.email,
                phone: params.phone,
                company: params.company,
                number_of_employees: params.number_of_employees,
                industry_type: params.industry_type
              };
              break;
            } catch (e) {
              console.error('Error parsing tool call params:', e);
            }
          }
        }
      }
      
      if (entry.role === 'user' && entry.message) {
        const message = entry.message;
        
        const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch && !leadData.email) leadData.email = emailMatch[1];
        
        const phoneMatch = message.match(/(\d{10,})/);
        if (phoneMatch && !leadData.phone) leadData.phone = phoneMatch[1];
        
        const companyMatch = message.match(/company\s*[-:]\s*(\w+)/i);
        if (companyMatch && !leadData.company) leadData.company = companyMatch[1];
        
        const employeesMatch = message.match(/employees\s*[-:]\s*(\d+)/i);
        if (employeesMatch && !leadData.number_of_employees) leadData.number_of_employees = employeesMatch[1];
        
        const industryMatch = message.match(/industry\s*[-:]\s*(\w+)/i);
        if (industryMatch && !leadData.industry_type) leadData.industry_type = industryMatch[1];
        
        if (!leadData.name && !message.toLowerCase().includes('demo') && !message.toLowerCase().includes('want')) {
          const words = message.split(' ');
          for (const word of words) {
            if (word.length > 2 && !word.includes('@') && !word.match(/^\d+$/) && 
                !['demo', 'want', 'company', 'employees', 'industry'].includes(word.toLowerCase())) {
              leadData.name = word;
              break;
            }
          }
        }
      }
    }
  }

  if (leadData.name || leadData.email) {
    console.log('Extracted lead data:', leadData);
    return leadData;
  }

  return null;
}

async function sendLeadEmail(leadData, callData = null) {
  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Palgeo Lead Bot <leads@yourdomain.com>', // Use your domain
      to: [process.env.NOTIFICATION_EMAIL || 'skbad911@gmail.com'],
      subject: '🎯 New Lead from ElevenLabs Call - Palgeo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">
              🎯 New Lead Alert!
            </h1>
            
            ${callData ? `
              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #2196f3;">
                <h2 style="color: #1976d2; margin-top: 0; margin-bottom: 15px;">📞 Call Information</h2>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(callData.metadata?.start_time_unix_secs * 1000).toLocaleString()}</p>
                <p style="margin: 8px 0;"><strong>Duration:</strong> ${callData.metadata?.call_duration_secs || 'Unknown'} seconds</p>
                <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">${callData.analysis?.call_successful || 'Unknown'}</span></p>
              </div>
            ` : ''}
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4caf50;">
              <h2 style="color: #2e7d32; margin-top: 0; margin-bottom: 15px;">👤 Lead Details</h2>
              <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between; padding: 8px; background-color: white; border-radius: 4px;">
                  <strong>Name:</strong> <span>${leadData.name || '❌ Not provided'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px; background-color: white; border-radius: 4px;">
                  <strong>Email:</strong> <span style="color: #1976d2;">${leadData.email || '❌ Not provided'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px; background-color: white; border-radius: 4px;">
                  <strong>Phone:</strong> <span>${leadData.phone || '❌ Not provided'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px; background-color: white; border-radius: 4px;">
                  <strong>Company:</strong> <span>${leadData.company || '❌ Not provided'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px; background-color: white; border-radius: 4px;">
                  <strong>Employees:</strong> <span>${leadData.number_of_employees || '❌ Not provided'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px; background-color: white; border-radius: 4px;">
                  <strong>Industry:</strong> <span>${leadData.industry_type || '❌ Not provided'}</span>
                </div>
              </div>
            </div>
            
            ${callData ? `
              <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ff9800;">
                <h2 style="color: #f57c00; margin-top: 0; margin-bottom: 15px;">📝 Call Summary</h2>
                <p style="line-height: 1.6; color: #424242;">${callData.analysis?.transcript_summary || 'No summary available'}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
              <p style="margin: 0; color: #666;">
                <small>🕒 Received: ${new Date().toLocaleString()}</small>
              </p>
              ${callData ? `
                <p style="margin: 5px 0 0 0; color: #666;">
                  <small>Conversation ID: ${callData.conversation_id}</small>
                </p>
              ` : ''}
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('Lead email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}