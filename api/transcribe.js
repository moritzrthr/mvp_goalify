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

  const form = new IncomingForm({
    keepExtensions: true,
    multiples: false,
  });

  // Erstelle temporäres Verzeichnis
  const tempDir = path.join(process.cwd(), '/tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  form.uploadDir = tempDir;

  try {
    // Promise-basierte Verarbeitung statt Callback
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const audioFile = files.audio;
    if (!audioFile || !audioFile.filepath) {
      throw new Error('No valid audio file provided');
    }

    
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
        console.error('Error processing request:', error);
        return res.status(500).json({ 
          message: 'Error processing audio file', 
          error: error.message 
        });
      } finally {
      fs.unlinkSync(audioFile.filepath); // Temporäre Datei löschen
    }
  
}
