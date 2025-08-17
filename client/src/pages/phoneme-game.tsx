import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GameBoard from "@/components/game/GameBoard";
import ScoreBoard from "@/components/game/ScoreBoard";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useAuth } from "@/hooks/useAuth";
import { getRandomLetter, PORTUGUESE_LETTERS } from "@/utils/gameUtils";
import { Volume2, RotateCcw, Play, Settings, Mic, User, LogIn } from "lucide-react";
import { Link } from "wouter";

interface GameState {
  currentLetter: string;
  score: number;
  lives: number;
  streak: number;
  gameStarted: boolean;
  gameOver: boolean;
  level: number;
  sessionId?: string;
  startTime?: Date;
}

export default function PhonemeGame() {
  const [gameState, setGameState] = useState<GameState>({
    currentLetter: '',
    score: 0,
    lives: 3,
    streak: 0,
    gameStarted: false,
    gameOver: false,
    level: 1
  });

  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  
  const startTimeRef = useRef<Date>();
  const questionStartTimeRef = useRef<Date>();

  const { speak, speakLetter, isSupported, voices, hasCustomRecording } = useSpeechSynthesis();
  const { startGame, recordAnswer, endGame, canTrackProgress } = useGameProgress();
  const { user, isStudent } = useAuth();

  // Initialize game
  useEffect(() => {
    if (isSupported && voices.length > 0) {
      startNewRound();
    }
  }, [isSupported, voices]);

  const startNewRound = async () => {
    const newLetter = getRandomLetter();
    
    // Start game session if this is the first round and user is a student
    let sessionId = gameState.sessionId;
    if (!gameState.gameStarted && canTrackProgress) {
      try {
        const session = await startGame.mutateAsync();
        sessionId = session.id;
        startTimeRef.current = new Date();
      } catch (error) {
        console.error('Error starting game session:', error);
      }
    }
    
    setGameState(prev => ({
      ...prev,
      currentLetter: newLetter,
      gameStarted: true,
      sessionId,
      startTime: startTimeRef.current
    }));
    setSelectedLetter('');
    setShowFeedback(false);
    
    // Track question start time
    questionStartTimeRef.current = new Date();
    
    // Speak the letter after a short delay
    setTimeout(() => {
      speakLetter(newLetter);
    }, 500);
  };


  const handleLetterSelect = async (letter: string) => {
    if (showFeedback || gameState.gameOver) return;

    setSelectedLetter(letter);
    const correct = letter === gameState.currentLetter;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    const responseTime = questionStartTimeRef.current 
      ? Date.now() - questionStartTimeRef.current.getTime() 
      : 0;

    // Record answer if student is logged in
    if (canTrackProgress && gameState.sessionId) {
      try {
        await recordAnswer.mutateAsync({
          sessionId: gameState.sessionId,
          letter: gameState.currentLetter,
          selectedAnswer: letter,
          isCorrect: correct,
          responseTimeMs: responseTime,
          currentStreak: correct ? gameState.streak + 1 : 0,
          currentLevel: gameState.level,
        });
      } catch (error) {
        console.error('Error recording answer:', error);
      }
    }

    if (correct) {
      // Correct answer
      setGameState(prev => ({
        ...prev,
        score: prev.score + (10 * prev.level),
        streak: prev.streak + 1,
        level: Math.floor((prev.streak + 1) / 5) + 1
      }));

      // Success sound
      speak('Muito bem!');
      
      setTimeout(() => {
        startNewRound();
      }, 2000);
    } else {
      // Wrong answer
      setGameState(prev => {
        const newLives = prev.lives - 1;
        const gameOver = newLives <= 0;
        
        return {
          ...prev,
          lives: newLives,
          streak: 0,
          level: 1,
          gameOver
        };
      });

      // Error sound and correct answer
      speak('Ops! A resposta correta é');
      setTimeout(() => {
        speakLetter(gameState.currentLetter);
      }, 1500);

      setTimeout(() => {
        if (gameState.lives > 1) {
          startNewRound();
        } else {
          // Game over - end session
          handleGameEnd();
        }
      }, 3000);
    }
  };

  const handleGameEnd = async () => {
    if (canTrackProgress && gameState.sessionId && gameState.startTime) {
      const totalQuestions = gameState.score / 10; // Rough estimate
      const timePlayedSeconds = Math.floor((Date.now() - gameState.startTime.getTime()) / 1000);
      
      try {
        await endGame.mutateAsync({
          sessionId: gameState.sessionId,
          sessionData: {
            totalScore: gameState.score,
            totalQuestions: Math.floor(totalQuestions),
            correctAnswers: Math.floor(totalQuestions * (gameState.streak / (gameState.streak + 1))), // Rough estimate
            wrongAnswers: 3 - gameState.lives, // Lives lost
            maxStreak: gameState.streak,
            finalLevel: gameState.level,
            timePlayedSeconds,
            completed: true,
          },
        });
      } catch (error) {
        console.error('Error ending game session:', error);
      }
    }
  };

  const resetGame = () => {
    setGameState({
      currentLetter: '',
      score: 0,
      lives: 3,
      streak: 0,
      gameStarted: false,
      gameOver: false,
      level: 1
    });
    setSelectedLetter('');
    setShowFeedback(false);
    setTimeout(() => startNewRound(), 500);
  };

  const repeatSound = () => {
    if (gameState.currentLetter) {
      speakLetter(gameState.currentLetter);
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">
                Áudio não suportado
              </h2>
              <p className="text-gray-600">
                Seu navegador não suporta síntese de voz. 
                Tente usar Chrome, Firefox ou Safari.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2 text-center">
                🎵 Jogo dos Fonemas 🎵
              </h1>
              <p className="text-lg text-purple-600 text-center">
                Ouça o som e toque na letra correta!
              </p>
              
              {/* User info and voice indicator */}
              <div className="flex justify-center items-center gap-4 mt-3">
                {user && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    <User className="w-4 h-4 mr-2" />
                    {isStudent ? `Aluno: ${user.firstName}` : `Prof. ${user.firstName}`}
                  </Badge>
                )}
                
                {PORTUGUESE_LETTERS.some(letter => hasCustomRecording(letter)) && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <Mic className="w-4 h-4 mr-2" />
                    👩‍🏫 Voz da professora
                  </Badge>
                )}
              </div>
              
              {!user && (
                <div className="text-center mt-3">
                  <p className="text-sm text-purple-500 mb-2">
                    Faça login para salvar seu progresso!
                  </p>
                  <div className="flex justify-center gap-2">
                    <Link href="/student-login">
                      <Button variant="outline" size="sm">
                        <LogIn className="w-4 h-4 mr-2" />
                        Login Aluno
                      </Button>
                    </Link>
                    <Link href="/teacher-login">
                      <Button variant="outline" size="sm">
                        <LogIn className="w-4 h-4 mr-2" />
                        Login Professora
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex flex-col gap-2">
              {user && (
                <>
                  {isStudent && (
                    <Link href="/student-login">
                      <Button variant="outline" size="sm" className="text-sm">
                        <User className="w-4 h-4 mr-2" />
                        Trocar Conta
                      </Button>
                    </Link>
                  )}
                  
                  <Link href="/audio-manager">
                    <Button variant="outline" size="sm" className="text-sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Gerenciar Áudios
                    </Button>
                  </Link>
                  
                  {user.type === 'teacher' && (
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm" className="text-sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Score Board */}
        <ScoreBoard 
          score={gameState.score}
          lives={gameState.lives}
          streak={gameState.streak}
          level={gameState.level}
        />

        {/* Game Area */}
        {!gameState.gameStarted && !gameState.gameOver ? (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <Volume2 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-purple-800 mb-2">
                  Pronto para começar?
                </h2>
                <p className="text-purple-600 mb-6">
                  Você vai ouvir o som de uma letra. Toque na letra correspondente!
                </p>
              </div>
              <Button 
                onClick={startNewRound}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-xl"
              >
                <Play className="w-6 h-6 mr-2" />
                Começar Jogo
              </Button>
            </CardContent>
          </Card>
        ) : gameState.gameOver ? (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <h2 className="text-3xl font-bold text-red-600 mb-2">
                  Fim de Jogo! 😢
                </h2>
                <p className="text-xl text-gray-700 mb-2">
                  Pontuação Final: <span className="font-bold text-purple-600">{gameState.score}</span>
                </p>
                <p className="text-lg text-gray-600 mb-6">
                  Melhor sequência: {gameState.streak} acertos seguidos
                </p>
              </div>
              <Button 
                onClick={resetGame}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-xl"
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                Jogar Novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current Challenge */}
            <Card className="mb-6">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl text-purple-800">
                  Qual letra faz este som?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <Button
                    onClick={repeatSound}
                    size="lg"
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 px-6 py-4"
                  >
                    <Volume2 className="w-8 h-8 mr-2" />
                    Repetir Som
                  </Button>
                </div>
                
                {showFeedback && (
                  <div className="mt-4">
                    <Badge 
                      variant={isCorrect ? "default" : "destructive"}
                      className={`text-lg px-4 py-2 ${
                        isCorrect 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {isCorrect ? "🎉 Correto!" : `❌ Era "${gameState.currentLetter}"`}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Board */}
            <GameBoard 
              onLetterSelect={handleLetterSelect}
              selectedLetter={selectedLetter}
              correctLetter={gameState.currentLetter}
              showFeedback={showFeedback}
              disabled={showFeedback}
            />
          </>
        )}

        {/* Instructions */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <h3 className="font-bold text-yellow-800 mb-2">Como Jogar:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>🔊 Ouça atentamente o som da letra</li>
              <li>👆 Toque na letra correspondente</li>
              <li>⭐ Ganhe pontos por acertos consecutivos</li>
              <li>❤️ Você tem 3 vidas - use-as bem!</li>
              <li>🏆 Níveis mais altos = mais pontos!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
