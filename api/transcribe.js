// pages/api/transcribe.js
import { Deepgram } from '@deepgram/sdk';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);

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

    console.log('Files received:', files);

    const audioFile = files.audio[0];

    if (!audioFile || !audioFile.filepath) {
      throw new Error('No audio file received or invalid file structure');
    }

    const buffer = fs.readFileSync(audioFile.filepath);

    const response = await deepgram.transcription.preRecorded(
      { buffer, mimetype: 'audio/wav' },
      {
        smart_format: true,
        language: 'de',
        model: 'enhanced',
      }
    );

    fs.unlinkSync(audioFile.filepath);

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
        stack: error.stack,
      },
    });
  }
}
