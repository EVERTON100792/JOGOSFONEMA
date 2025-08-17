import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";

interface PhonemeCardProps {
  letter: string;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  disabled?: boolean;
  showFeedback?: boolean;
  onSelect?: (letter: string) => void;
  onPlaySound?: (letter: string) => void;
  className?: string;
}

export default function PhonemeCard({
  letter,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
  disabled = false,
  showFeedback = false,
  onSelect,
  onPlaySound,
  className
}: PhonemeCardProps) {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(letter);
    }
  };

  const handleSoundClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlaySound) {
      onPlaySound(letter);
    }
  };

  const getCardClassName = () => {
    if (showFeedback) {
      if (isCorrect) {
        return "border-green-500 bg-green-50 shadow-green-200";
      }
      if (isWrong) {
        return "border-red-500 bg-red-50 shadow-red-200";
      }
    }
    
    if (isSelected) {
      return "border-purple-500 bg-purple-50 shadow-purple-200 transform scale-105";
    }
    
    return "border-purple-200 hover:border-purple-300 hover:bg-purple-25 hover:shadow-purple-100";
  };

  const getTextClassName = () => {
    if (showFeedback) {
      if (isCorrect) return "text-green-700";
      if (isWrong) return "text-red-700";
    }
    
    if (isSelected) return "text-purple-700";
    return "text-purple-600";
  };

  return (
    <Card
      className={cn(
        "relative transition-all duration-300 cursor-pointer touch-manipulation",
        "hover:shadow-lg active:scale-95",
        getCardClassName(),
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center min-h-[120px]">
        {/* Letter Display */}
        <div className="text-center mb-2">
          <span className={cn(
            "text-4xl md:text-5xl font-bold transition-colors duration-300",
            getTextClassName()
          )}>
            {letter}
          </span>
        </div>

        {/* Sound Button */}
        {onPlaySound && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSoundClick}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              "hover:bg-purple-100 active:scale-95",
              disabled && "pointer-events-none"
            )}
            disabled={disabled}
          >
            <Volume2 className="w-4 h-4 text-purple-600" />
          </Button>
        )}

        {/* Feedback Indicator */}
        {showFeedback && (
          <div className="absolute top-2 right-2">
            {isCorrect && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            )}
            {isWrong && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✗</span>
              </div>
            )}
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && !showFeedback && (
          <div className="absolute inset-0 border-2 border-purple-400 rounded-lg pointer-events-none" />
        )}
      </CardContent>
    </Card>
  );
}
