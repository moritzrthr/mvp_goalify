// api/analyseText.js
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Dein OpenAI API-Schlüssel aus den Umgebungsvariablen
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { text } = req.body;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4", // Du kannst auch das Modell anpassen, je nachdem, was du benötigst
        messages: [
          {
            role: "user",
            content: `Extrahiere aus folgendem Text die folgenden Informationen: 
              ALTER/BESCHÄFTIGUNG
              ALLTAGSABLAUF
              ZIELE
              PROBLEME
              BISHERIGE VERSUCHE.
              Text: "${text}"`,
          },
        ],
      });

      const extractedInfo = response.choices[0].message.content;
      res.status(200).json({ result: extractedInfo });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Fehler beim Abrufen der Antwort von OpenAI." });
    }
  } else {
    res.status(405).json({ error: "Methode nicht erlaubt" });
  }
}
