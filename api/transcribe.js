import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Deaktiviere den Standard-Body-Parser von Vercel
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const form = new IncomingForm();
  form.uploadDir = path.join(process.cwd(), '/tmp'); // Temporäres Verzeichnis
  form.keepExtensions = true; // Behalte Dateiendungen

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form data:", err);
      return res.status(500).json({ message: 'Error parsing form data', error: err.message });
    }

    const audioFile = files.audio; // Name des Felds muss "audio" sein
    if (!audioFile) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    try {
      const fileStream = fs.createReadStream(audioFile.filepath);

      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav',
        },
        body: fileStream,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Deepgram API Error:", result);
        return res.status(500).json({ message: 'Transcription failed', error: result });
      }

      res.status(200).json({
        transcription: result.results.channels[0].alternatives[0].transcript,
      });
    } catch (error) {
      console.error("Error during transcription:", error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } finally {
      fs.unlinkSync(audioFile.filepath); // Temporäre Datei löschen
    }
  });
}
