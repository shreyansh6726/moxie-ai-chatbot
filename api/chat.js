import Groq from "groq-sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  const parsed = JSON.parse(body);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: "mixtral-8x7b-32768",
    messages: [
      { role: "user", content: parsed.message }
    ]
  });

  res.status(200).json({
    reply: completion.choices[0].message.content
  });
}
