import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { getLeaderboard, getSubjectLeaderboard } from "@/api/user";
import { getSpeedTypeLeaderboard } from "@/api/speedtype";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";

type GameType = "overall" | "math" | "general" | "coding" | "science" | "word" | "grammar" | "speedtype";

const GAME_LABELS: Record<GameType, string> = {
  overall: "Overall XP",
  math: "Math Quiz",
  general: "General Knowledge",
  coding: "Coding Quiz",
  science: "Science Quiz",
  word: "Word Scramble",
  grammar: "Grammar Quiz",
  speedtype: "Speed Typing",
};

const GAME_EMOJIS: Record<GameType, string> = {
  overall: "🏆",
  math: "🧮",
  general: "📚",
  coding: "💻",
  science: "🔬",
  word: "🔤",
  grammar: "✏️",
  speedtype: "⚡",
};

export function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameType, setGameType] = useState<GameType>("overall");
  const [speedTypeDifficulty, setSpeedTypeDifficulty] = useState<string | undefined>(undefined);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        let data;

        if (gameType === "overall") {
          data = await getLeaderboard();
          setLeaderboard(data);
        } else if (gameType === "speedtype") {
          const response = await getSpeedTypeLeaderboard(speedTypeDifficulty);
          setLeaderboard(response.leaderboard || []);
        } else {
          // For quiz-based games (math, general, coding, science, word, grammar)
          // The gameType matches the subject name
          data = await getSubjectLeaderboard(gameType);
          setLeaderboard(data);
        }
      } catch (error: unknown) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load leaderboard",
          variant: "destructive",
        });
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [gameType, speedTypeDifficulty, toast]);

  return (
    <div className="bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/menu')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            🏆 Leaderboards
          </h1>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>

        {/* Game Filter Tabs */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GAME_LABELS) as GameType[]).map((game) => (
                <button
                  key={game}
                  onClick={() => setGameType(game)}
                  className={`px-4 py-2 rounded-lg transition-all border-2 ${
                    gameType === game
                      ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                      : "border-muted-foreground/20 text-muted-foreground hover:border-cyan-500/50"
                  }`}
                >
                  <span className="mr-2">{GAME_EMOJIS[game]}</span>
                  {GAME_LABELS[game]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Speed Typing Difficulty Filter */}
        {gameType === "speedtype" && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Select Difficulty:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSpeedTypeDifficulty(undefined)}
                    className={`px-4 py-2 rounded-lg transition-all border-2 ${
                      speedTypeDifficulty === undefined
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                        : "border-muted-foreground/20 text-muted-foreground hover:border-cyan-500/50"
                    }`}
                  >
                    🏆 All Time Best
                  </button>
                  {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() => setSpeedTypeDifficulty(difficulty)}
                      className={`px-4 py-2 rounded-lg transition-all border-2 ${
                        speedTypeDifficulty === difficulty
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                          : "border-muted-foreground/20 text-muted-foreground hover:border-cyan-500/50"
                      }`}
                    >
                      {difficulty === 'easy' && '🟢'}
                      {difficulty === 'medium' && '🟡'}
                      {difficulty === 'hard' && '🔴'}
                      {' '}{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card className="border-2 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-2xl">
              {GAME_EMOJIS[gameType]} {GAME_LABELS[gameType]} Leaderboard
              {gameType === "speedtype" && speedTypeDifficulty && (
                <span className="ml-2 text-lg">
                  {speedTypeDifficulty === 'easy' && '🟢'}
                  {speedTypeDifficulty === 'medium' && '🟡'}
                  {speedTypeDifficulty === 'hard' && '🔴'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id || entry._id || index}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      user && (entry.id === user._id || entry._id === user._id)
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-muted-foreground/20 bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Rank Badge */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500">
                        {index === 0 && <span className="text-xl">🥇</span>}
                        {index === 1 && <span className="text-xl">🥈</span>}
                        {index === 2 && <span className="text-xl">🥉</span>}
                        {index > 2 && (
                          <span className="font-bold text-white">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">
                            {entry.username}
                          </h4>
                          {user && (entry.id === user._id || entry._id === user._id) && (
                            <span className="text-xs bg-cyan-500/30 text-cyan-400 px-2 py-1 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Level {entry.level}
                        </p>
                      </div>
                    </div>

                    {/* Score Display */}
                    <div className="text-right">
                      {gameType === "speedtype" ? (
                        <div>
                          <p className="text-2xl font-bold text-cyan-400">
                            {entry.bestWPM || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">WPM</p>
                        </div>
                      ) : gameType === "overall" ? (
                        <div>
                          <p className="text-2xl font-bold text-cyan-400">
                            {entry.xp || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">XP</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <p className="text-2xl font-bold text-cyan-400">
                              {entry.xp || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">XP</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-green-400">
                              {entry.bestScore || 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">Best Score</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Trophy className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No leaderboard data available yet</p>
                <p className="text-sm">Be the first to play this game!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-cyan-400">{leaderboard.length}</p>
            </CardContent>
          </Card>

          {user && leaderboard.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Your Rank</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-400">
                    #{
                      leaderboard.findIndex(
                        (entry) =>
                          entry.id === user._id || entry._id === user._id
                      ) + 1
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {gameType === "speedtype" ? "Your WPM" : "Your XP"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-400">
                    {gameType === "speedtype"
                      ? user.speedTypeStats?.bestWPM || 0
                      : user.xp || 0}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
