import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Book, Code, Beaker, Shuffle, GraduationCap, Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { getQuizzes, getAllSubjectStats } from "@/api/quiz";

const QUIZ_ICONS = {
  math: Brain,
  general: Book,
  coding: Code,
  science: Beaker,
  word: Shuffle,
  grammar: GraduationCap,
};

// Define symbols for each quiz type
const QUIZ_SYMBOLS = {
  math: ["➕", "➖", "✖️", "➗", "π", "∑", "√", "∞"],
  general: ["🌍", "📚", "🔍", "💡", "🏛️", "🧩", "🎓"],
  coding: ["</>", "{ }", "[]", "==", "&&", "||", "#", "function()"],
  science: ["⚗️", "🧪", "🔬", "🧬", "⚛️", "🧲", "📊"],
  word: ["🔤", "📝", "🔡", "📄", "📔", "🖋️", "✏️"],
  grammar: [".", "?", "!", ",", ":", ";", "\"\"", "()"],
};

// Colors for the symbols
const SYMBOL_COLORS = [
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-red-500",
  "text-indigo-500",
  "text-orange-500",
  "text-teal-500",
  "text-pink-500",
];

export function Games() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const navigate = useNavigate();
  // Track which quizzes have been played
  const [playedQuizzes, setPlayedQuizzes] = useState<Set<string>>(new Set());
  // Track subject stats
  const [subjectStats, setSubjectStats] = useState<any>({});
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    getQuizzes().then(setQuizzes);
    
    // Load subject stats
    getAllSubjectStats()
      .then((data) => {
        const statsMap: any = {};
        data.subjects.forEach((subject: any) => {
          statsMap[subject.subject] = subject;
        });
        setSubjectStats(statsMap);
      })
      .catch((error) => console.error('Error loading subject stats:', error));

    // Load played quizzes from localStorage
    const storedPlayedQuizzes = localStorage.getItem('playedQuizzes');
    if (storedPlayedQuizzes) {
      setPlayedQuizzes(new Set(JSON.parse(storedPlayedQuizzes)));
    }
  }, []);

  const handleStartGame = (quizId: string) => {
    // Check if this quiz has been played before
    const hasBeenPlayed = playedQuizzes.has(quizId);

    // If quiz has been played, include regenerate=true parameter
    if (hasBeenPlayed) {
      navigate(`/games/${quizId}?regenerate=true`);
    } else {
      navigate(`/games/${quizId}`);
    }
  };

  // Function to generate animated symbols
  const renderSymbols = (quizType: string, count: number = 6) => {
    const symbols = QUIZ_SYMBOLS[quizType as keyof typeof QUIZ_SYMBOLS] || QUIZ_SYMBOLS.general;
    const animationClasses = ["animate-float", "animate-pulse-slow", "animate-bounce"];

    return Array.from({ length: count }).map((_, index) => {
      const symbol = symbols[index % symbols.length];
      const color = SYMBOL_COLORS[index % SYMBOL_COLORS.length];
      const animation = animationClasses[index % animationClasses.length];

      // Position each symbol randomly around the card
      const style = {
        position: 'absolute' as const,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        fontSize: `${Math.random() * 1 + 0.8}rem`,
        opacity: Math.random() * 0.5 + 0.3,
        transform: `rotate(${Math.random() * 360}deg)`,
        zIndex: 0,
      };

      return (
        <span
          key={`${quizType}-symbol-${index}`}
          className={`${color} ${animation}`}
          style={style}
        >
          {symbol}
        </span>
      );
    });
  };

  // Filter games based on search query
  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter standalone games based on search query
  const standaloneGames = [
    { id: 'speedtype', name: 'Speed Typing Challenge', emoji: '⚡', keywords: ['speed', 'typing', 'challenge', 'wpm'] },
    { id: 'wordle', name: 'Wordle', emoji: '📝', keywords: ['wordle', 'word', 'guess'] },
    { id: 'hangman', name: 'Hangman', emoji: '🎮', keywords: ['hangman', 'word', 'game'] },
    { id: 'memorymatch', name: 'Memory Match', emoji: '🧠', keywords: ['memory', 'match', 'cards'] },
    { id: 'logicgrid', name: 'Logic Grid Detective', emoji: '🔍', keywords: ['logic', 'grid', 'detective', 'puzzle'] },
    { id: 'blocklyturtle', name: 'Blockly Turtle', emoji: '🐢', keywords: ['blockly', 'turtle', 'programming', 'code'] },
    { id: 'emojifactory', name: 'Emoji Factory', emoji: '🏭', keywords: ['emoji', 'factory', 'conditionals', 'logic'] },
  ];

  const filteredStandaloneGames = standaloneGames.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.keywords.some(keyword => keyword.includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Games</h1>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 bg-white border-2 border-gray-300 rounded-lg px-4 py-3 focus-within:border-blue-500 focus-within:shadow-md transition-all">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search games, quizzes, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-gray-800 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Speed Typing Game Section */}
      {filteredStandaloneGames.some(g => g.id === 'speedtype') && (
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Speed Typing Challenge
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Test your typing speed and accuracy</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Type as many words as you can correctly in 60 seconds. Choose from three difficulty levels and compete on the leaderboard!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            onClick={() => navigate('/speedtype')}
          >
            <span className="mr-2">⚡</span>
            Start Speed Typing
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Wordle Game Section */}
      {filteredStandaloneGames.some(g => g.id === 'wordle') && (
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <span className="text-2xl">🟩</span>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Wordle
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Guess the 5-letter word in 6 tries</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Can you guess the secret word? Each guess reveals clues about which letters are correct. Green means correct position, yellow means wrong position!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            onClick={() => navigate('/wordle')}
          >
            <span className="mr-2">🟩</span>
            Play Wordle
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Hangman Game Section */}
      {filteredStandaloneGames.some(g => g.id === 'hangman') && (
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <span className="text-2xl">🎮</span>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Hangman
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Guess the word letter by letter</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            A classic word-guessing game! Guess letters to reveal the hidden word before the hangman is complete. You have 6 wrong guesses to spare!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={() => navigate('/hangman')}
          >
            <span className="mr-2">🎮</span>
            Play Hangman
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Memory Match Game Section */}
      {filteredStandaloneGames.some(g => g.id === 'memorymatch') && (
      <Card className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border-indigo-500/30 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <span className="text-2xl">🧠</span>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                  Memory Match
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Test your memory and matching skills</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Flip cards to find matching pairs! Remember card positions and complete all matches as fast as you can. Choose from three difficulty levels!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
            onClick={() => navigate('/memorymatch')}
          >
            <span className="mr-2">🧠</span>
            Play Memory Match
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Puzzle Builder Game Section - Hidden for now */}
      {/*
      <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <span className="text-2xl">🧩</span>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  Puzzle Builder
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Learn geography with educational puzzles</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Solve geographical puzzles by arranging regions and countries in the correct order! Learn world geography while having fun with multiple difficulty levels!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            onClick={() => navigate('/puzzlebuilder')}
          >
            <span className="mr-2">🧩</span>
            Play Puzzle Builder
          </Button>
        </CardContent>
      </Card>
      */}

      {/* Logic Grid Detective Game Section */}
      {filteredStandaloneGames.some(g => g.id === 'logicgrid') && (
      <Card className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/30 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">
                  Logic Grid Detective
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Solve mysteries with logic and reasoning</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Crack mystery cases using logic, deduction, and reasoning! Fill a grid matrix by reading clues to discover who stole what, where people live, seating arrangements, and more!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            onClick={() => navigate('/logicgrid')}
          >
            <span className="mr-2">🔍</span>
            Play Logic Grid Detective
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Blockly Turtle Game Section */}
      {filteredStandaloneGames.some(g => g.id === 'blocklyturtle') && (
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <span className="text-2xl">🐢</span>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Blockly Turtle
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Learn coding through visual programming</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Master programming fundamentals with Blockly! Control a virtual turtle to draw shapes, solve puzzles, and learn coding concepts like loops, conditions, and functions through 20+ levels!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={() => navigate('/blocklyturtle')}
          >
            <span className="mr-2">🐢</span>
            Play Blockly Turtle
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Emoji Factory Game Section */}
      {filteredStandaloneGames.some(g => g.id === 'emojifactory') && (
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <span className="text-2xl">🏭</span>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Emoji Factory
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Learn conditionals, properties & automation</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Master programming fundamentals by sorting emojis based on complex conditional rules. Learn if/else logic, identify properties (color, type), and automate data filtering through 8 progressive levels!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={() => navigate('/emojifactory')}
          >
            <span className="mr-2">🏭</span>
            Play Emoji Factory
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Quiz Games Section */}
      {searchQuery === '' || filteredQuizzes.length > 0 ? (
      <div>
        <h2 className="text-xl font-semibold mb-4">Quiz Games</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredQuizzes.map((quiz) => {
          const Icon = QUIZ_ICONS[quiz.type as keyof typeof QUIZ_ICONS] || Book;
          const hasBeenPlayed = playedQuizzes.has(quiz._id);
          const stats = subjectStats[quiz.type];

          return (
            <div key={quiz._id} className="relative">
              {/* Animated symbols */}
              {renderSymbols(quiz.type)}

              <Card className="hover:shadow-lg transition-shadow relative z-10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{quiz.title}</CardTitle>
                        {stats && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Score: {stats.averageScore.toFixed(1)}% • Level: <span className="font-semibold capitalize">{stats.currentDifficulty}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{quiz.description}</p>
                  {stats && (
                    <div className="mb-4 p-3 bg-muted rounded-lg text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Attempts:</span>
                        <span className="font-semibold">{stats.attempts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Best Score:</span>
                        <span className="font-semibold">{stats.bestScore || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>XP Gained:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.totalXP ?? 0}</span>
                      </div>
                    </div>
                  )}
                  <Button
                    className="w-full button-hover"
                    onClick={() => handleStartGame(quiz._id)}
                  >
                    {hasBeenPlayed ? "Play Again" : "Start Game"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        })}
        </div>
      </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No games found matching "{searchQuery}"</p>
          <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4">
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}