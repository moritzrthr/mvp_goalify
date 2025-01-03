const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const util = require('util');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { text } = req.body;  // Text, den wir in Sprache umwandeln möchten

    try {
      // Initialisiere den Google Cloud Text-to-Speech Client
      const client = new TextToSpeechClient({
        credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS), // Lade die Google API Anmeldeinformationen aus der Umgebungsvariable
      });

      // Anfrage für die Text-to-Speech-API
      const request = {
        input: { text: text },
        // Stelle die Sprache und Stimme ein
        voice: { languageCode: 'de-DE', ssmlGender: 'MALE' },
        audioConfig: { audioEncoding: 'MP3' },
      };

      // Führe die Anfrage aus
      const [response] = await client.synthesizeSpeech(request);

      // Generiere eine temporäre MP3-Datei (Die Datei wird jedoch direkt im Speicher verarbeitet)
      const audioBuffer = response.audioContent;

      // Rückgabe der Audiodaten im Base64-Format als URL (oder du kannst es als Datei an den Client senden)
      res.status(200).json({
        audioUrl: `data:audio/mp3;base64,${audioBuffer.toString('base64')}`,
      });
    } catch (err) {
      console.error('Fehler bei der Anfrage an Google Cloud Text-to-Speech:', err);
      res.status(500).json({ error: 'Fehler bei der Anfrage an Google Cloud Text-to-Speech' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};
