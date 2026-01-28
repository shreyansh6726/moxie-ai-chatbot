const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = async function handler(req, res) {
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'API Key is missing in environment variables' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let { messages } = req.body || { messages: [] };

    const hasSystemMessage = Array.isArray(messages) && messages.some(msg => msg.role === 'system');

    if (!hasSystemMessage) {
      messages = [
        {
          role: 'system',
          content:
            'You are a helpful assistant. You must always respond using Markdown formatting. Use bolding for emphasis, bullet points for lists, and code blocks for any code snippets to ensure high readability.',
        },
        ...messages,
      ];
    }

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile',
    });

    const responseText = (completion && completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content) || 'No response content';
    res.status(200).json({ text: responseText });
  } catch (error) {
    console.error('Groq API Error Details:', error);
    res.status(500).json({ error: error && error.message ? error.message : String(error) });
  }
};