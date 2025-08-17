import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PORTUGUESE_LETTERS } from "@/utils/gameUtils";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  onLetterSelect: (letter: string) => void;
  selectedLetter: string;
  correctLetter: string;
  showFeedback: boolean;
  disabled: boolean;
}

export default function GameBoard({
  onLetterSelect,
  selectedLetter,
  correctLetter,
  showFeedback,
  disabled
}: GameBoardProps) {
  const getButtonVariant = (letter: string) => {
    if (!showFeedback) {
      return selectedLetter === letter ? "default" : "outline";
    }
    
    if (letter === correctLetter) {
      return "default"; // Correct letter - green
    }
    
    if (letter === selectedLetter && letter !== correctLetter) {
      return "destructive"; // Wrong selection - red
    }
    
    return "outline"; // Other letters
  };

  const getButtonClassName = (letter: string) => {
    if (!showFeedback) {
      return selectedLetter === letter 
        ? "bg-purple-600 hover:bg-purple-700 text-white transform scale-105" 
        : "border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400";
    }
    
    if (letter === correctLetter) {
      return "bg-green-500 hover:bg-green-600 text-white transform scale-105 animate-pulse";
    }
    
    if (letter === selectedLetter && letter !== correctLetter) {
      return "bg-red-500 hover:bg-red-600 text-white";
    }
    
    return "border-gray-300 text-gray-500 opacity-60";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {PORTUGUESE_LETTERS.map((letter) => (
            <Button
              key={letter}
              onClick={() => onLetterSelect(letter)}
              disabled={disabled}
              variant={getButtonVariant(letter)}
              className={cn(
                "h-16 w-16 sm:h-18 sm:w-18 text-2xl sm:text-3xl font-bold rounded-xl transition-all duration-300 touch-manipulation",
                getButtonClassName(letter),
                disabled && "cursor-not-allowed"
              )}
            >
              {letter}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
