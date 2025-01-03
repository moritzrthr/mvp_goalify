import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);

  // Diese Funktion ruft nun die eigene Serverless API auf, um Text in Sprache umzuwandeln
  const synthesizeSpeech = async (text) => {
    console.log("Synthesize Speech gestartet mit Text:", text);
    try {
      // Anfrage an die Serverless API auf Vercel
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
      }

      const data = await response.json();
      console.log("API-Antwort erhalten:", data);

      // Die zurückgegebene Audio-URL (Base64-kodiert) wird verwendet
      const audioContent = data.audioUrl;
      const audio = new Audio(audioContent); // Die Base64-kodierte URL direkt als Audio abspielen
      audio.play();
    } catch (error) {
      console.error('Fehler bei Text-to-Speech:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      // Der Text für die Begrüßung, der in Sprache umgewandelt werden soll
      synthesizeSpeech(
        "Schön, dass du da bist! Erzähle mir von dir und deinen Zielen. Was möchtest du in deinem Leben verändern?"
      );
    } catch (err) {
      console.error("Fehler beim Zugriff auf das Mikrofon:", err);
    }
  };

  // Begrüßung beim ersten Laden
  useEffect(() => {
    const welcomeMessage =
      "Willkommen bei Goalify! Ich bin dein persönlicher KI-Coach. Klicke auf 'Jetzt durchstarten' wenn du bereit bist.";
    const timeoutId = setTimeout(() => synthesizeSpeech(welcomeMessage), 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Willkommen bei Goalify</h1>
        <p>
          Dein persönlicher KI-Coach für nachhaltige Gewohnheitsänderungen.
          Erzähl uns von dir, und wir erstellen einen maßgeschneiderten Plan
          für deine Ziele.
        </p>

        {!isRecording ? (
          <button className="start-button" onClick={startRecording}>
            Jetzt durchstarten
          </button>
        ) : (
          <div className="recording-section">
            <div className="recording-indicator">Aufnahme läuft...</div>
            <p>Erzähl uns von dir und deinen Zielen. Wir hören zu!</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
