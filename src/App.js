// src/App.js
import React, { useState } from 'react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      // Hier werden wir später die Aufnahmelogik implementieren
    } catch (err) {
      console.error("Fehler beim Zugriff auf das Mikrofon:", err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Willkommen bei Micro-Habit-Coach</h1>
        <p>
          Dein persönlicher KI-Coach für nachhaltige Gewohnheitsänderungen. 
          Erzähl uns von dir, und wir erstellen einen maßgeschneiderten Plan für deine Ziele.
        </p>
        
        {!isRecording ? (
          <button 
            className="start-button"
            onClick={startRecording}
          >
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