import React, { useRef, useState, useEffect } from 'react';
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
  const [transcriptions, setTranscriptions] = useState([]);
  const [debugMessage, setDebugMessage] = useState('');


  const playAudio2 = (audioFile, callback) => {
    const audio = new Audio(audioFile);
    audio.play();
    audio.onended = callback;
  };

  const handleButtonClick = () => {
    playAudio2('/audio/onboarding_2.mp3', startRecording);
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
      console.log("Recording started");
    } catch (err) {
      console.error("Fehler beim Zugriff auf das Mikrofon:", err);
    }
  };
  
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      audioChunksRef.current = [];
      setIsRecording(false);
      setDebugMessage('Recording stopped. Uploading audio for transcription...');

      // Audio hochladen und transkribieren
      const formData = new FormData();
      formData.append('audio', audioBlob);

      try {
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }

        const data = await response.json();

        if (data.transcription) {
          setDebugMessage('Transcription successful!');
          setTranscriptions((prev) => [...prev, data.transcription]);
        } else {
          console.error("Transcription failed. Response:", data);
          setDebugMessage('Transcription failed. Please try again.');
        }
      } catch (error) {
        console.error("Error during transcription:", error);
        setDebugMessage(`Error during transcription: ${error.message}`);
      }
    };
  };

  // Begrüßung beim ersten Laden
  useEffect(() => {
    // Abspielen der ersten Audio-Datei beim ersten Laden der Seite
    
  }, []);

  const playAudio = (audioFile) => {
    const audio = new Audio(audioFile);
    audio.play();
  };

  const handleUserInteraction = () => {
    if (!hasPlayedIntro) {
      playAudio('/audio/onboarding_1.mp3');
    setHasPlayedIntro(true);
    }
    
  };

  return (
    <div className="App" onClick={handleUserInteraction}>
      <header className="App-header">
        <h1>Willkommen bei Goalify</h1>
        <p>
          Dein persönlicher KI-Coach für nachhaltige Gewohnheitsänderungen.
          Erzähl uns von dir, und wir erstellen einen maßgeschneiderten Plan
          für deine Ziele.
        </p>

        {!isRecording ? (
          <button className="start-button" onClick={handleButtonClick}>
            Starte deinen Wandel – Kostenlos ausprobieren.
          </button>
        ) : (
          <div className="recording-section">
            <div className="recording-indicator">Erzähl einfach mal...</div>
            <p>Welcher Typ bist du, welchen Alltag und welche Ziele hast du?</p>
            <button className="start-button" onClick={stopRecording}>
              Fertig erzählt
            </button>
          </div>
        )}<div className="debug-section">
        <h3>Debugging:</h3>
        <p>{debugMessage}</p>
      </div>

      <div className="transcriptions-section">
        <h3>Transkriptionen:</h3>
        {transcriptions.length > 0 ? (
          <ul>
            {transcriptions.map((transcription, index) => (
              <li key={index}>{transcription}</li>
            ))}
          </ul>
        ) : (
          <p>Noch keine Transkriptionen vorhanden.</p>
        )}
      </div>
    </header>
  </div>
  );
}

export default App;
