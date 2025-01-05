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
          console.error('Error parsing form:', err);
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    console.log('Files received:', files);

    // Greifen Sie auf die Audiodatei zu (aus dem Array extrahieren)
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile || !audioFile.filepath) {
      throw new Error('Keine gültige Audiodatei empfangen.');
    }

    // Senden Sie die Datei zur Transkription an Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(audioFile.filepath),
      {
        model: 'nova-2', // Modellname (z. B. 'nova-2')
        smart_format: true, // Option für besser formatierte Ergebnisse
        language: 'de', // Sprache
      },
      
    );

    console.log('Transcription result:', result); // Log transcription result

    // Löschen Sie die temporäre Datei
    try {
      fs.unlinkSync(audioFile.filepath);
    } catch (unlinkError) {
      console.error('Fehler beim Löschen der temporären Datei:', unlinkError);
    }

    if (error) {
      throw new Error(`Deepgram API Error: ${error}`);
    }
    const transcription = response.results?.channels[0]?.alternatives[0]?.transcript;

    if (!transcription) {
      throw new Error('No transcription result received from Deepgram');
    }
    
    return res.status(200).json({ transcription });
    
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
