import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";

interface GameSession {
  id: string;
  studentId: string;
  startedAt: string;
  endedAt?: string;
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  maxStreak: number;
  finalLevel: number;
  timePlayedSeconds: number;
  completed: boolean;
}

interface GameAnswer {
  sessionId: string;
  letter: string;
  selectedAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
  currentStreak: number;
  currentLevel: number;
}

export function useGameProgress() {
  const queryClient = useQueryClient();
  const { isStudent } = useAuth();

  // Start game session
  const startGame = useMutation({
    mutationFn: async (): Promise<GameSession> => {
      const res = await apiRequest("POST", "/api/game/start");
      return res.json();
    },
  });

  // Record answer
  const recordAnswer = useMutation({
    mutationFn: async (answerData: GameAnswer) => {
      const res = await apiRequest("POST", "/api/game/answer", answerData);
      return res.json();
    },
  });

  // End game session
  const endGame = useMutation({
    mutationFn: async ({ 
      sessionId, 
      sessionData 
    }: { 
      sessionId: string; 
      sessionData: Partial<GameSession> 
    }) => {
      const res = await apiRequest("PUT", `/api/game/end/${sessionId}`, sessionData);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate game history
      queryClient.invalidateQueries({ queryKey: ["/api/game/history"] });
    },
  });

  return {
    startGame,
    recordAnswer,
    endGame,
    canTrackProgress: isStudent,
  };
}