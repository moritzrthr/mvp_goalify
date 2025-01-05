// pages/api/transcribe.js
import formidable from 'formidable';
import { createClient } from '@deepgram/sdk';
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
    // Parse das Multipart-Formular mit Promise
    const form = new formidable.IncomingForm();
    
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
    console.log('Audio file:', files.audio);

    // Zugriff auf die Audiodatei
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile || !audioFile.filepath) {
      throw new Error('No audio file received or invalid file structure');
    }

    // Lesen Sie die Audiodatei als Buffer
    const buffer = fs.readFileSync(audioFile.filepath);

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

    // Lösche die temporäre Datei
    try {
      fs.unlinkSync(audioFile.filepath);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }

    const transcription = result.channels[0].alternatives[0].transcript;

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