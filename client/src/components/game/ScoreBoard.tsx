import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Trophy, Target } from "lucide-react";

interface ScoreBoardProps {
  score: number;
  lives: number;
  streak: number;
  level: number;
}

export default function ScoreBoard({ score, lives, streak, level }: ScoreBoardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Score */}
      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Pontuação</p>
              <p className="text-2xl font-bold">{score}</p>
            </div>
            <Star className="w-8 h-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Lives */}
      <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Vidas</p>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-6 h-6 ${
                      i < lives ? "fill-current" : "opacity-30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak */}
      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Sequência</p>
              <p className="text-2xl font-bold">{streak}</p>
            </div>
            <Target className="w-8 h-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Level */}
      <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Nível</p>
              <p className="text-2xl font-bold">{level}</p>
            </div>
            <Trophy className="w-8 h-8 opacity-80" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
