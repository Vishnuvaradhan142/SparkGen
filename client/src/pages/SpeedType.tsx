import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, Volume2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { useToast } from '@/hooks/useToast';
import { submitSpeedType } from '@/api/speedtype';

interface Word {
  word: string;
  typed: string;
  correct: boolean | null;
}

interface GameStats {
  wordsPerMinute: number;
  accuracy: number;
  wordsCorrect: number;
  totalWords: number;
  timeElapsed: number;
}

interface DifficultyStats {
  bestWPM: number;
  bestAccuracy: number;
  gamesPlayed: number;
}

const DURATIONS = [15, 30, 60, 120, 300, 600]; // seconds
const DIFFICULTY_LEVELS = {
  easy: { wordList: 'common' },
  medium: { wordList: 'medium' },
  hard: { wordList: 'advanced' },
};

const WORD_LISTS = {
  common: [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  ],
  medium: [
    'development', 'language', 'programming', 'function', 'variable', 'algorithm',
    'database', 'network', 'software', 'hardware', 'interface', 'system',
    'application', 'process', 'memory', 'storage', 'server', 'client',
    'protocol', 'framework', 'library', 'component', 'structure', 'module',
    'feature', 'performance', 'security', 'quality', 'testing', 'deployment',
  ],
  advanced: [
    'asynchronous', 'concurrency', 'polymorphism', 'encapsulation', 'abstraction',
    'inheritance', 'composition', 'optimization', 'refactoring', 'debugging',
    'architecture', 'scalability', 'resilience', 'latency', 'throughput',
    'virtualization', 'containerization', 'orchestration', 'microservices', 'distributed',
    'consensus', 'consistency', 'availability', 'partition', 'idempotent',
  ],
};

const getDurationLabel = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds === 60) return '1m';
  if (seconds === 120) return '2m';
  if (seconds === 300) return '5m';
  if (seconds === 600) return '10m';
  return `${Math.floor(seconds / 60)}m`;
};

export function SpeedType() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [duration, setDuration] = useState(60);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  const [timeLeft, setTimeLeft] = useState(60);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [levelStats, setLevelStats] = useState<{
    [key: string]: DifficultyStats;
  }>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Load stats from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('speedTypeStats');
    if (savedStats) {
      setLevelStats(JSON.parse(savedStats));
    }
  }, []);

  const generateWords = () => {
    const wordList = WORD_LISTS[DIFFICULTY_LEVELS[difficulty].wordList as keyof typeof WORD_LISTS];
    const newWords: Word[] = [];
    
    // Generate enough words for the duration
    // Assuming average typing speed, generate words proportional to duration
    const wordsToGenerate = Math.ceil((duration / 60) * 80);
    for (let i = 0; i < wordsToGenerate; i++) {
      newWords.push({
        word: wordList[Math.floor(Math.random() * wordList.length)],
        typed: '',
        correct: null,
      });
    }
    
    return newWords;
  };

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(duration);
    setCurrentWordIndex(0);
    setWords(generateWords());
    startTimeRef.current = Date.now();
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleInputChange = (value: string) => {
    if (gameState !== 'playing' || currentWordIndex >= words.length) return;

    const currentWord = words[currentWordIndex];
    const newWords = [...words];

    // Check if word is complete (space pressed or word matches)
    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      newWords[currentWordIndex] = {
        word: currentWord.word,
        typed: typedWord,
        correct: typedWord === currentWord.word,
      };

      // Move to next word
      setCurrentWordIndex(currentWordIndex + 1);
      setWords(newWords);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } else {
      newWords[currentWordIndex] = { ...currentWord, typed: value };
      setWords(newWords);
    }
  };

  useEffect(() => {
    if (gameState === 'finished' && startTimeRef.current) {
      const timeElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      const wordsCompleted = words.filter((w) => w.correct !== null).length;
      const wordsCorrect = words.filter((w) => w.correct === true).length;
      
      // Calculate WPM based on actual duration
      const wpm = Math.round((wordsCompleted / duration) * 60);
      const accuracy = wordsCompleted > 0 ? Math.round((wordsCorrect / wordsCompleted) * 100) : 0;

      const stats: GameStats = {
        wordsPerMinute: wpm,
        accuracy,
        wordsCorrect,
        totalWords: wordsCompleted,
        timeElapsed,
      };

      setGameStats(stats);

      // Update local stats
      const statsKey = `${difficulty}_${duration}`;
      setLevelStats((prev) => {
        const updated = { ...prev };
        const current = updated[statsKey] || { bestWPM: 0, bestAccuracy: 0, gamesPlayed: 0 };
        
        updated[statsKey] = {
          bestWPM: Math.max(current.bestWPM, wpm),
          bestAccuracy: Math.max(current.bestAccuracy, accuracy),
          gamesPlayed: current.gamesPlayed + 1,
        };
        
        localStorage.setItem('speedTypeStats', JSON.stringify(updated));
        return updated;
      });

      // Submit to backend
      submitSpeedType({
        difficulty,
        wpm,
        accuracy,
        wordsCorrect,
        totalWords: wordsCompleted,
      })
        .then(() => {
          toast({ title: 'Speed typing game saved!' });
        })
        .catch((error) => {
          console.error('Error saving speed typing game:', error);
          toast({ title: 'Error saving game results', variant: 'destructive' });
        });
    }
  }, [gameState, duration]);

  const resetGame = () => {
    setGameState('menu');
    setTimeLeft(60);
    setCurrentWordIndex(0);
    setWords([]);
    setGameStats(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSpeak = () => {
    if (currentWordIndex < words.length) {
      const currentWord = words[currentWordIndex];
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      speechSynthesis.speak(utterance);
    }
  };

  if (gameState === 'menu') {
    const statsKey = `${difficulty}_${duration}`;
    const currentStats = levelStats[statsKey];
    
    return (
        <div className="bg-gradient-to-b from-background to-secondary/20 p-4">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/games')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>

            <Card className="mb-6 border-2 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-4xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  ⚡ Speed Typing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  Type as many words as you can correctly in the selected duration. Challenge yourself with different difficulty levels!
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        difficulty === level
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-muted-foreground/20 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="text-2xl font-bold capitalize mb-2">
                        {level === 'easy' && '🟢'}
                        {level === 'medium' && '🟡'}
                        {level === 'hard' && '🔴'}
                        {' '}{level}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {level === 'easy' && 'Common words'}
                        {level === 'medium' && 'Programming terms'}
                        {level === 'hard' && 'Advanced concepts'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {DURATIONS.map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setDuration(dur)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        duration === dur
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-muted-foreground/20 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="font-semibold text-sm">
                        {getDurationLabel(dur)}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {currentStats && (
              <Card className="mb-6 border-2 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-lg">Your Best at {difficulty.toUpperCase()} - {getDurationLabel(duration)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-cyan-500">{currentStats.bestWPM}</p>
                      <p className="text-sm text-muted-foreground">WPM</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-500">{currentStats.bestAccuracy}%</p>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-500">{currentStats.gamesPlayed}</p>
                      <p className="text-sm text-muted-foreground">Games</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={startGame}
              size="lg"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Game - {difficulty.toUpperCase()} ({getDurationLabel(duration)})
            </Button>
          </div>
        </div>
    );
  }

  if (gameState === 'playing') {
    const currentWord = words[currentWordIndex];
    const progress = Math.round((currentWordIndex / words.length) * 100);

    return (
        <div className="bg-gradient-to-b from-background to-secondary/20 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Time</p>
                    <p className="text-3xl font-bold text-cyan-400">{timeLeft}s</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Words</p>
                    <p className="text-3xl font-bold text-green-400">
                      {words.filter((w) => w.correct !== null).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {words.filter((w) => w.correct !== null).length > 0
                        ? Math.round(
                            (words.filter((w) => w.correct === true).length /
                              words.filter((w) => w.correct !== null).length) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Word Display */}
            <Card className="mb-6 border-2 border-cyan-500/30">
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-6">
                  <div className="text-6xl font-bold tracking-widest text-cyan-400 font-mono">
                    {currentWord?.word || 'Complete!'}
                  </div>

                  {/* Input Field */}
                  <div className="flex gap-2 justify-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={words[currentWordIndex]?.typed || ''}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Type the word and press space..."
                      className="px-4 py-3 rounded-lg bg-secondary border-2 border-cyan-500/50 focus:border-cyan-500 focus:outline-none text-lg w-80 text-center"
                      autoFocus
                      disabled={currentWordIndex >= words.length}
                    />
                    <Button
                      onClick={handleSpeak}
                      size="icon"
                      variant="outline"
                      className="border-cyan-500/50"
                    >
                      <Volume2 className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Word List Preview */}
                  <div className="pt-4 text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {words.slice(currentWordIndex, currentWordIndex + 5).map((w, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1 rounded-full ${
                            idx === 0
                              ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                              : w.correct === true
                              ? 'bg-green-500/20 text-green-400'
                              : w.correct === false
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {w.word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    );
  }

  // Finished State
  if (gameStats) {
    return (
        <div className="bg-gradient-to-b from-background to-secondary/20 p-4">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-6 border-2 border-cyan-500/30">
              <CardHeader className="text-center">
                <CardTitle className="text-4xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Game Finished! 🎉
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Session Info */}
            <Card className="mb-6 border-2 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-center">
                  {difficulty.toUpperCase()} - {getDurationLabel(duration)}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">WPM</p>
                    <p className="text-4xl font-bold text-cyan-400">{gameStats.wordsPerMinute}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Accuracy</p>
                    <p className="text-4xl font-bold text-green-400">{gameStats.accuracy}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Words Correct</p>
                    <p className="text-4xl font-bold text-blue-400">{gameStats.wordsCorrect}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Time Taken</p>
                    <p className="text-4xl font-bold text-purple-400">{getDurationLabel(duration)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Best Stats Comparison */}
            {levelStats[`${difficulty}_${duration}`] && (
              <Card className="mb-6 border-2 border-green-500/30 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-lg">Your Personal Best</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Best WPM:</p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {levelStats[`${difficulty}_${duration}`].bestWPM}
                        {gameStats.wordsPerMinute > levelStats[`${difficulty}_${duration}`].bestWPM && (
                          <span className="text-sm text-green-400 ml-2">🔥 New Record!</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Best Accuracy:</p>
                      <p className="text-2xl font-bold text-green-400">
                        {levelStats[`${difficulty}_${duration}`].bestAccuracy}%
                        {gameStats.accuracy > levelStats[`${difficulty}_${duration}`].bestAccuracy && (
                          <span className="text-sm text-green-400 ml-2">🔥 New Record!</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* XP Earned */}
            <Card className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">XP Earned</p>
                  <p className="text-4xl font-bold text-amber-400">
                    +{Math.round(gameStats.wordsPerMinute * (1 + gameStats.accuracy / 100))}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={resetGame}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={() => navigate('/games')}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
              </Button>
            </div>
          </div>
        </div>
    );
  }

  return null;
}
