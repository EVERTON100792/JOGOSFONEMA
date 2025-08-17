// Portuguese alphabet letters
export const PORTUGUESE_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

// Get a random letter from the alphabet
export function getRandomLetter(): string {
  const randomIndex = Math.floor(Math.random() * PORTUGUESE_LETTERS.length);
  return PORTUGUESE_LETTERS[randomIndex];
}

// Calculate score based on level and streak
export function calculateScore(baseScore: number, level: number, streak: number): number {
  const levelMultiplier = level;
  const streakBonus = Math.floor(streak / 5) * 5; // Bonus every 5 streak
  return baseScore * levelMultiplier + streakBonus;
}

// Get level based on score
export function getLevelFromScore(score: number): number {
  return Math.floor(score / 100) + 1;
}

// Get congratulatory messages for different achievements
export function getCongratulationMessage(streak: number): string {
  if (streak >= 20) return "Incrível! Você é um mestre dos fonemas! 🏆";
  if (streak >= 15) return "Fantástico! Continue assim! ⭐";
  if (streak >= 10) return "Excelente! Você está arrasando! 🎉";
  if (streak >= 5) return "Muito bem! Você está pegando o ritmo! 👏";
  return "Ótimo trabalho! 😊";
}

// Difficulty settings
export const DIFFICULTY_SETTINGS = {
  easy: {
    timeLimit: null, // No time limit
    lives: 5,
    scoreMultiplier: 1
  },
  normal: {
    timeLimit: 10000, // 10 seconds
    lives: 3,
    scoreMultiplier: 1.5
  },
  hard: {
    timeLimit: 5000, // 5 seconds
    lives: 1,
    scoreMultiplier: 2
  }
};
