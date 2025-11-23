import express from "express";
import Groq from "groq-sdk";

const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await client.chat.completions.create({
    model: "mixtral-8x7b-32768",
    messages: [
      { role: "user", content: req.body.message }
    ]
  });

  res.json({ reply: completion.choices[0].message.content });
});

app.listen(3000, () => console.log("API running on port 3000"));
