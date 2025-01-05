import { createClient } from '@deepgram/sdk';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Deaktiviert den Body-Parser, damit formidable die Datei verarbeiten kann
  },
};

// Initialisiere den Deepgram-Client mit dem API-Key
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verwenden Sie formidable, um die hochgeladene Datei zu verarbeiten
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

    // Greifen Sie auf die Audiodatei zu
    const audioFile = files.audio;
    if (!audioFile || !audioFile.filepath) {
      throw new Error('Keine gültige Audiodatei empfangen.');
    }

    // Lesen Sie die Datei als Buffer
    const buffer = fs.readFileSync(audioFile.filepath);

    // Senden Sie die Datei zur Transkription an Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeBuffer(
      { buffer },
      {
        model: 'nova-2', // Modellname (z. B. 'nova-2')
        language: 'de',  // Spracheinstellung
      },
    );

    // Löschen Sie die temporäre Datei
    try {
      fs.unlinkSync(audioFile.filepath);
    } catch (unlinkError) {
      console.error('Fehler beim Löschen der temporären Datei:', unlinkError);
    }

    if (error) {
      throw new Error(`Deepgram API Error: ${error}`);
    }

    // Rückgabe der Transkription
    return res.status(200).json({ transcription: result });
  } catch (error) {
    console.error('Fehlerdetails:', error);
    return res.status(500).json({
      message: 'Fehler bei der Verarbeitung der Audiodatei',
      error: error.message,
      details: {
        name: error.name,
        code: error.code,
        stack: error.stack,
      },
    });
  }
}
