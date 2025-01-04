import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const audioFile = req.body.audio; // Base64 oder URL der Audiodatei
  const fileType = req.body.type || 'audio/wav'; // Standard: WAV

  if (!audioFile) {
    return res.status(400).json({ message: 'No audio file provided' });
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': fileType,
      },
      body: audioFile, // Audiodatei im Body der Anfrage
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(500).json({ message: 'Transcription failed', error: result });
    }

    return res.status(200).json({
      transcription: result.results.channels[0].alternatives[0].transcript,
    });
  } catch (error) {
    console.error('Error during transcription:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
