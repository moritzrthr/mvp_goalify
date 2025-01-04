import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { v4 as uuidv4 } from 'uuid';


const getDeviceToken = () => {
  let deviceToken = localStorage.getItem('deviceToken');
  if (!deviceToken) {
    deviceToken = uuidv4();
    localStorage.setItem('deviceToken', deviceToken);
  }
  return deviceToken;
};


function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const playAudio = (audioFile, callback) => {
    const audio = new Audio(audioFile);
    audio.play();
    audio.onended = callback;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Fehler beim Zugriff auf das Mikrofon:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      audioChunksRef.current = [];
      //here the audio is safed
      setIsRecording(false);

      
    };
  };

  const handleButtonClick = () => {
    playAudio('/audio/onboarding_2.mp3', startRecording);
  };

  useEffect(() => {
    if (!hasPlayedIntro) {
      playAudio('/audio/onboarding_1.mp3', () => {
        setHasPlayedIntro(true);
      });
    }
  }, [hasPlayedIntro]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Willkommen bei Goalify</h1>
        <p>
          Dein persönlicher KI-Coach für nachhaltige Gewohnheitsänderungen.
          Erzähl uns von dir, und wir erstellen einen maßgeschneiderten Plan
          für deine Ziele.
        </p>

        {!isRecording && hasPlayedIntro ? (
          <button className="start-button" onClick={handleButtonClick}>
            Starte deinen Wandel – Kostenlos ausprobieren.
          </button>
        ) : (
          <div className="recording-section">
            <div className="recording-indicator">Erzähl einfach mal...</div>
            <p>Welcher Typ bist du, welchen Alltag und welche Ziele hast du?</p>
            <button className="stop-button" onClick={stopRecording}>
              Fertig erzählt
            </button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;