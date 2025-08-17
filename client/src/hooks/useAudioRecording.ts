import { useState, useCallback, useRef, useEffect } from 'react';

interface AudioRecordingHook {
  isRecording: boolean;
  recordedAudio: { [letter: string]: Blob };
  startRecording: (letter: string) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  playRecording: (letter: string) => void;
  uploadAudio: (letter: string, file: File) => void;
  deleteRecording: (letter: string) => void;
  downloadRecording: (letter: string) => void;
  hasRecording: (letter: string) => boolean;
  isSupported: boolean;
}

export function useAudioRecording(): AudioRecordingHook {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ [letter: string]: Blob }>({});
  const [isSupported, setIsSupported] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentLetterRef = useRef<string>('');

  // Load saved recordings from localStorage and check browser support
  useEffect(() => {
    // Check browser support
    const checkSupport = () => {
      setIsSupported(
        typeof navigator !== 'undefined' && 
        navigator.mediaDevices && 
        typeof navigator.mediaDevices.getUserMedia === 'function'
      );
    };
    
    const loadSavedRecordings = async () => {
      const savedKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('phoneme_audio_')
      );
      
      const recordings: { [letter: string]: Blob } = {};
      
      for (const key of savedKeys) {
        const letter = key.replace('phoneme_audio_', '');
        const base64 = localStorage.getItem(key);
        if (base64) {
          try {
            const response = await fetch(base64);
            const blob = await response.blob();
            recordings[letter] = blob;
          } catch (error) {
            console.error(`Error loading saved recording for ${letter}:`, error);
          }
        }
      }
      
      setRecordedAudio(recordings);
    };

    checkSupport();
    loadSavedRecordings();
  }, []);

  const startRecording = useCallback(async (letter: string) => {
    if (!isSupported) {
      throw new Error('Gravação de áudio não é suportada neste navegador');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      audioChunksRef.current = [];
      currentLetterRef.current = letter;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        
        // Save to state
        setRecordedAudio(prev => ({
          ...prev,
          [currentLetterRef.current]: audioBlob
        }));

        // Save to localStorage as base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          localStorage.setItem(`phoneme_audio_${currentLetterRef.current}`, base64);
        };
        reader.readAsDataURL(audioBlob);

        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, [isSupported]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return new Promise<Blob>((resolve) => {
        const checkForBlob = () => {
          const letter = currentLetterRef.current;
          if (recordedAudio[letter]) {
            resolve(recordedAudio[letter]);
          } else {
            setTimeout(checkForBlob, 100);
          }
        };
        checkForBlob();
      });
    }
    return null;
  }, [isRecording, recordedAudio]);

  const playRecording = useCallback((letter: string) => {
    const audioBlob = recordedAudio[letter];
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        URL.revokeObjectURL(audioUrl);
      });
    }
  }, [recordedAudio]);

  const uploadAudio = useCallback((letter: string, file: File) => {
    if (!file.type.startsWith('audio/')) {
      throw new Error('Por favor, selecione um arquivo de áudio válido');
    }

    // Convert file to blob and save
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      localStorage.setItem(`phoneme_audio_${letter}`, base64);
      
      // Update state
      setRecordedAudio(prev => ({
        ...prev,
        [letter]: file
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const deleteRecording = useCallback((letter: string) => {
    localStorage.removeItem(`phoneme_audio_${letter}`);
    setRecordedAudio(prev => {
      const newState = { ...prev };
      delete newState[letter];
      return newState;
    });
  }, []);

  const downloadRecording = useCallback((letter: string) => {
    const audioBlob = recordedAudio[letter];
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `letra_${letter.toLowerCase()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [recordedAudio]);

  const hasRecording = useCallback((letter: string) => {
    return letter in recordedAudio;
  }, [recordedAudio]);

  return {
    isRecording,
    recordedAudio,
    startRecording,
    stopRecording,
    playRecording,
    uploadAudio,
    deleteRecording,
    downloadRecording,
    hasRecording,
    isSupported
  };
}