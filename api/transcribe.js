// pages/api/transcribe.js
import formidable from 'formidable';
import { createClient } from '@deepgram/sdk';

// Konfigurieren Sie formidable, um das Parsen von Formulardaten zu ermöglichen
export const config = {
  api: {
    bodyParser: false,
  },
};

// Neue Initialisierung für Deepgram v3 mit createClient
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse das Multipart-Formular
    const form = formidable();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const audioFile = files.audio;
    
    // Lesen Sie die Audiodatei als Buffer
    const buffer = await new Promise((resolve, reject) => {
      const chunks = [];
      const readStream = require('fs').createReadStream(audioFile.filepath);
      
      readStream.on('data', (chunk) => chunks.push(chunk));
      readStream.on('end', () => resolve(Buffer.concat(chunks)));
      readStream.on('error', reject);
    });

    // V3 Syntax für die Transkription
    const { result } = await deepgram.transcribe({
      buffer,
      mimetype: 'audio/wav',
      options: {
        smart_format: true,
        language: 'de',
        model: 'enhanced'
      }
    });

    const transcription = result.channels[0].alternatives[0].transcript;

    return res.status(200).json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ 
      message: 'Error processing audio', 
      error: error.message,
      stack: error.stack 
    });
  }
}