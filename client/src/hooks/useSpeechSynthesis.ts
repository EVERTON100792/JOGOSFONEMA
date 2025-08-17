import { useState, useEffect, useCallback } from 'react';
import { useAudioRecording } from './useAudioRecording';

interface SpeechSynthesisHook {
  speak: (text: string) => void;
  speakLetter: (letter: string) => void;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  isPlaying: boolean;
  hasCustomRecording: (letter: string) => boolean;
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { playRecording, hasRecording } = useAudioRecording();

  useEffect(() => {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      // Load voices immediately and on voiceschanged event
      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure for Portuguese Brazilian
    utterance.lang = 'pt-BR';
    utterance.rate = 0.8; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher pitch for friendliness
    utterance.volume = 1;

    // Try to find a Portuguese Brazilian voice
    const brazilianVoice = voices.find(voice => 
      voice.lang.includes('pt-BR') || 
      voice.lang.includes('pt_BR') ||
      (voice.lang.includes('pt') && voice.name.toLowerCase().includes('brasil'))
    );

    // Fallback to any Portuguese voice
    const portugueseVoice = voices.find(voice => 
      voice.lang.includes('pt')
    );

    // Use the best available voice
    if (brazilianVoice) {
      utterance.voice = brazilianVoice;
    } else if (portugueseVoice) {
      utterance.voice = portugueseVoice;
    }

    // Set playing state
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    // Speak the text
    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

  const speakLetter = useCallback((letter: string) => {
    // First, try to use custom recording if available
    if (hasRecording(letter)) {
      playRecording(letter);
      return;
    }

    // Fallback to speech synthesis with phonetic pronunciation
    const phonemeMap: { [key: string]: string } = {
      'A': 'ah',
      'B': 'bê',
      'C': 'cê',
      'D': 'dê',
      'E': 'eh',
      'F': 'éfe',
      'G': 'gê',
      'H': 'agá',
      'I': 'i',
      'J': 'jota',
      'K': 'cá',
      'L': 'éle',
      'M': 'ême',
      'N': 'ene',
      'O': 'ô',
      'P': 'pê',
      'Q': 'quê',
      'R': 'erre',
      'S': 'esse',
      'T': 'tê',
      'U': 'u',
      'V': 'vê',
      'W': 'dáblio',
      'X': 'xis',
      'Y': 'ípsilon',
      'Z': 'zê'
    };

    const soundToSpeak = phonemeMap[letter] || letter;
    speak(soundToSpeak);
  }, [hasRecording, playRecording, speak]);

  const hasCustomRecording = useCallback((letter: string) => {
    return hasRecording(letter);
  }, [hasRecording]);

  return {
    speak,
    speakLetter,
    isSupported,
    voices,
    isPlaying,
    hasCustomRecording
  };
}
