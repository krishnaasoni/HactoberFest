/**
 * ============================================================================
 * CarePulse — Serverless API Endpoint (/api/chat.js)
 * Vercel Serverless Function for Google Gemini API integration.
 *
 * SECURE: The GEMINI_API_KEY is read strictly from process.env and is never
 * exposed to frontend browser code.
 * ============================================================================
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Verify that the secret Gemini API key is configured
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    try {
      const fs = await import('fs');
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
        if (match) apiKey = match[1].trim();
      }
    } catch (e) {}
  }

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables or .env file.'
    });
  }

  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message payload.' });
    }

    // CarePulse AI System Instruction prompt
    const systemPrompt = `You are CarePulse AI, a friendly health assistant. Give only general health information in simple language (reply in the same language the user writes: Hindi, Hinglish, or English). Never diagnose, never prescribe, never advise changing or stopping a dosage. Keep answers short and clear. Always end with a reminder to consult a doctor or pharmacist for personal medical decisions.`;

    // Format chat history for Gemini API
    const contents = [];

    if (Array.isArray(history)) {
      history.forEach(item => {
        if (item.text && item.role) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
          });
        }
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.95
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API call failed with response:', errBody);
      return res.status(response.status).json({
        error: 'Failed to generate response from Gemini API.',
        details: errBody
      });
    }

    const data = await response.json();
    const candidate = data.candidates && data.candidates[0];
    const generatedText = candidate?.content?.parts?.[0]?.text || 'No response generated.';

    return res.status(200).json({
      reply: generatedText
    });

  } catch (error) {
    console.error('Server error handling /api/chat:', error);
    return res.status(500).json({
      error: 'An internal server error occurred while processing your request.',
      message: error.message
    });
  }
}
