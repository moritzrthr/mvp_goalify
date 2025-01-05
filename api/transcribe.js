// pages/api/transcribe.js
import { createClient } from '@deepgram/sdk';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    // Debug-Logging
    console.log('Files received:', files);
    
    // Zugriff auf die Audiodatei (jetzt als Array)
    const audioFile = files.audio[0];

    if (!audioFile || !audioFile.filepath) {
      throw new Error('No audio file received or invalid file structure');
    }

    // Lesen Sie die Audiodatei als Buffer
    const buffer = fs.readFileSync(audioFile.filepath);

    // Neue Deepgram V3 Syntax
    const response = await deepgram.listen.transcribe(
      buffer,
      {
        smart_format: true,
        language: 'de',
        model: 'enhanced',
        mime_type: 'audio/wav'
      }
    );

    // Lösche die temporäre Datei
    try {
      fs.unlinkSync(audioFile.filepath);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }

    const transcription = response.results?.channels[0]?.alternatives[0]?.transcript;

    if (!transcription) {
      throw new Error('No transcription result received from Deepgram');
    }

    return res.status(200).json({ transcription });
  } catch (error) {
    console.error('Full error details:', error);
    return res.status(500).json({ 
      message: 'Error processing audio', 
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        stack: error.stack
      }
    });
  }
}