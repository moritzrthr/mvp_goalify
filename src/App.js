import React, { useRef, useState, useEffect, useCallback } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
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
    //playAudio2('/audio/onboarding_2.mp3', startRecording);
    startRecording();
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioUrl(null);
      console.log("Recording started");
    } catch (err) {
      console.error("Fehler beim Zugriff auf das Mikrofon:", err);
      setDebugMessage("Fehler beim Zugriff auf das Mikrofon: " + err.message);
    }
  }, []);
  
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          audioChunksRef.current = [];
          setIsRecording(false);
          setDebugMessage('Aufnahme beendet - Transkription wird erstellt...');
          
          // Senden Sie die Audiodatei zur Transkription
          setIsProcessing(true);
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.wav');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Transkription fehlgeschlagen: ${response.status}`);
          }

          const data = await response.json();
          if (data.transcription) {
            setTranscriptions(prev => [...prev, data.transcription]);
            setDebugMessage('Transkription erfolgreich erstellt!');
          }
        } catch (error) {
          console.error('Error during transcription:', error);
          setDebugMessage(`Fehler bei der Transkription: ${error.message}`);
          setTranscriptions(prev => [...prev, "Transkription fehlgeschlagen."]);
        } finally {
          setIsProcessing(false);
        }
        
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    });
  }, []);


  

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleUserInteraction = () => {
    if (!hasPlayedIntro) {
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
          <button 
            className="start-button" 
            onClick={handleButtonClick}
            disabled={isProcessing}
          >
            {isProcessing ? 'Verarbeite Aufnahme...' : 'Starte deinen Wandel – Kostenlos ausprobieren.'}
          </button>
        ) : (
          <div className="recording-section">
            <div className="recording-indicator">Erzähl einfach mal...</div>
            <p>Welcher Typ bist du, welchen Alltag und welche Ziele hast du?</p>
            <button 
              className="start-button" 
              onClick={stopRecording}
              disabled={isProcessing}
            >
              Fertig erzählt
            </button>
          </div>
        )}

        {audioUrl && (
          <div className="playback-section">
            <h3>Ihre Aufnahme anhören:</h3>
            <audio controls src={audioUrl}>
              Ihr Browser unterstützt das Audio-Element nicht.
            </audio>
          </div>
        )}

        <div className="debug-section">
          <h3>Status:</h3>
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