import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, HelpCircle, ArrowLeft, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { submitSpeedType } from '@/api/speedtype';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number;
  totalTime: number;
  currentStreak: number;
  maxStreak: number;
  totalXP: number;
  lastPlayedDate: string;
}

const EMOJIS = ['🍎', '🍌', '🍊', '🍇', '🍓', '🍒', '🥝', '🍑', '🌟', '🎨', '🎯', '🎪'];

const DIFFICULTIES = {
  easy: { pairs: 6, moves: 50 },
  medium: { pairs: 8, moves: 35 },
  hard: { pairs: 12, moves: 25 },
};

export function MemoryMatch() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'won'>('menu');
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const [stats, setStats] = useState<MemoryStats>(() => {
    try {
      const raw = localStorage.getItem('memoryStats');
      if (raw) return JSON.parse(raw) as MemoryStats;
    } catch {}
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      bestTime: 0,
      totalTime: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalXP: 0,
      lastPlayedDate: '',
    };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStateRef = useRef<'menu' | 'playing' | 'won'>('menu');
  const difficultyRef = useRef<'easy' | 'medium' | 'hard'>('easy');

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // Initialize game
  const startGame = () => {
    const pairsCount = DIFFICULTIES[difficulty].pairs;
    const selectedEmojis = EMOJIS.slice(0, pairsCount);
    const gameCards = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(gameCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setTimeLeft(300); // 5 minutes
    setGameState('playing');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setGameState('won');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Check for matches
  useEffect(() => {
    if (flipped.length !== 2) return;

    const [first, second] = flipped;
    const firstCard = cards[first];
    const secondCard = cards[second];

    if (firstCard.emoji === secondCard.emoji) {
      setMatched([...matched, first, second]);
      setScore(prev => prev + 10);
      setFlipped([]);
    } else {
      setTimeout(() => setFlipped([]), 600);
    }

    setMoves(prev => prev + 1);
  }, [flipped, cards, matched]);

  // Check win condition
  useEffect(() => {
    if (gameState !== 'playing' || cards.length === 0) return;
    const pairsCount = DIFFICULTIES[difficultyRef.current].pairs;
    if (matched.length === pairsCount * 2) {
      clearInterval(timerRef.current!);
      setGameState('won');
      updateStats(true);
    }
  }, [matched, gameState, cards]);

  const updateStats = async (won: boolean) => {
    const timeTaken = 300 - timeLeft;
    const pairsCount = DIFFICULTIES[difficulty].pairs;
    
    // Calculate XP based on performance
    // Base XP: 100
    // Time bonus: 0-50 XP (faster = more XP)
    //   - 30 seconds or less: +50 XP
    //   - 60 seconds: +35 XP
    //   - 120 seconds: +20 XP
    //   - 180 seconds: +10 XP
    //   - 240+ seconds: +5 XP
    // Moves bonus: 0-50 XP (fewer moves = more XP)
    //   - Perfect (pairs * 2): +50 XP
    //   - Pairs * 2 + 5: +40 XP
    //   - Pairs * 2 + 10: +30 XP
    //   - Pairs * 2 + 20: +20 XP
    //   - Pairs * 2 + 30: +10 XP
    
    const minMoves = pairsCount * 2;
    
    // Time bonus calculation
    let timeBonus = 0;
    if (timeTaken <= 30) timeBonus = 50;
    else if (timeTaken <= 60) timeBonus = 35;
    else if (timeTaken <= 120) timeBonus = 20;
    else if (timeTaken <= 180) timeBonus = 10;
    else timeBonus = 5;
    
    // Moves bonus calculation
    let movesBonus = 0;
    const movesDiff = moves - minMoves;
    if (movesDiff <= 0) movesBonus = 50; // Perfect game
    else if (movesDiff <= 5) movesBonus = 40;
    else if (movesDiff <= 10) movesBonus = 30;
    else if (movesDiff <= 20) movesBonus = 20;
    else if (movesDiff <= 30) movesBonus = 10;
    else movesBonus = 5;
    
    // Difficulty multiplier
    const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.3 : 1.6;
    
    // Calculate final XP
    const xp = Math.round((50 + timeBonus + movesBonus) * difficultyMultiplier);
    
    setXpEarned(xp);

    const newStats: MemoryStats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      gamesWon: won ? stats.gamesWon + 1 : stats.gamesWon,
      bestTime: won && (stats.bestTime === 0 || timeTaken < stats.bestTime) ? timeTaken : stats.bestTime,
      totalTime: stats.totalTime + timeTaken,
      currentStreak: won ? stats.currentStreak + 1 : 0,
      maxStreak: won ? Math.max(stats.maxStreak, stats.currentStreak + 1) : stats.maxStreak,
      totalXP: stats.totalXP + xp,
      lastPlayedDate: new Date().toISOString(),
    };

    setStats(newStats);
    localStorage.setItem('memoryStats', JSON.stringify(newStats));

    try {
      const wpm = Math.max(20, 150 - (moves * 2) - (timeTaken / 10));
      const accuracy = Math.max(40, 100 - ((moves - minMoves) * 5) - (timeTaken / 30));
      
      await submitSpeedType({
        difficulty,
        wpm: Math.round(wpm),
        accuracy: Math.round(accuracy),
        wordsCorrect: won ? 1 : 0,
        totalWords: 1,
      });
    } catch (err) {
      console.error('Failed to submit Memory Match score:', err);
    }
  };

  const handleCardClick = (index: number) => {
    if (gameState !== 'playing') return;
    if (flipped.includes(index) || matched.includes(index)) return;
    
    setFlipped([...flipped, index]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showHelp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-blue-600">How to Play Memory Match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-bold mb-2 text-blue-600">Objective</h3>
              <p>Find all matching pairs of cards by flipping them over. Remember the positions of the cards to make matches faster!</p>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-blue-600">How It Works</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Click on cards to flip them and reveal the emoji</li>
                <li>Find matching pairs of cards</li>
                <li>When you match a pair, both cards stay flipped</li>
                <li>Complete all pairs to win the game</li>
                <li>Fewer moves and faster time = more XP!</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-blue-600">Difficulties</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Easy: 6 pairs (12 cards)</li>
                <li>Medium: 8 pairs (16 cards)</li>
                <li>Hard: 12 pairs (24 cards)</li>
              </ul>
            </div>
            <Button onClick={() => setShowHelp(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Back to Game</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showStats) {
    const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-amber-600">Memory Match Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.gamesWon}</p>
                <p className="text-sm text-gray-600">Wins</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.gamesPlayed}</p>
                <p className="text-sm text-gray-600">Total Games</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-600">{winRate}%</p>
                <p className="text-sm text-gray-600">Win Rate</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.currentStreak}</p>
                <p className="text-sm text-gray-600">Current Streak</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">{formatTime(stats.bestTime)}</p>
                <p className="text-sm text-gray-600">Best Time</p>
              </div>
              <div className="bg-pink-50 border border-pink-200 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-pink-600">{stats.totalXP}</p>
                <p className="text-sm text-gray-600">Total XP</p>
              </div>
            </div>
            <Button onClick={() => setShowStats(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Back to Game</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 flex items-start justify-center pt-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-3xl text-blue-600">Memory Match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-gray-600">Select difficulty and start matching cards!</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`p-3 rounded-lg font-semibold transition-all ${
                        difficulty === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                      <p className="text-xs mt-1">
                        {DIFFICULTIES[level].pairs} pairs
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={startGame} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-3">
                Start Game
              </Button>
              <Button onClick={() => setShowStats(true)} variant="outline" className="flex-1">
                <Trophy className="w-4 h-4 mr-2" />
                Stats
              </Button>
              <Button onClick={() => setShowHelp(true)} variant="outline" className="flex-1">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
            </div>

            <Button onClick={() => navigate('/games')} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/games')}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-3xl font-bold text-foreground">Memory Match</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(true)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Statistics"
            >
              <Trophy className="w-6 h-6 text-amber-500" />
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Help"
            >
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Time</p>
              <p className="text-2xl font-bold text-blue-600">{formatTime(timeLeft)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Moves</p>
              <p className="text-2xl font-bold text-amber-600">{moves}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Matched</p>
              <p className="text-2xl font-bold text-emerald-600">{matched.length / 2}/{DIFFICULTIES[difficulty].pairs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-2xl font-bold text-purple-600">{score}</p>
            </CardContent>
          </Card>
        </div>

        {/* Game Board */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className={`grid gap-2 mb-6`} style={{
              gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cards.length))}, minmax(0, 1fr))`
            }}>
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  className={`
                    aspect-square rounded-lg font-bold text-5xl transition-all duration-300 flex items-center justify-center
                    ${flipped.includes(index) || matched.includes(index)
                      ? 'bg-blue-100 border-2 border-blue-400 cursor-default'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer shadow-lg'
                    }
                  `}
                  disabled={gameState !== 'playing'}
                >
                  <span className="leading-none">{flipped.includes(index) || matched.includes(index) ? card.emoji : '?'}</span>
                </button>
              ))}
            </div>

            <Button onClick={() => setGameState('menu')} className="w-full bg-gray-600 hover:bg-gray-700 text-white">
              <RotateCcw className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Win Popup */}
      {gameState === 'won' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-white">
            <CardContent className="pt-8">
              <div className="text-center">
                <p className="text-5xl mb-4">🎉</p>
                <p className="text-3xl font-bold text-emerald-600 mb-2">You Won!</p>
                <p className="text-gray-600 mb-6">
                  Completed in <span className="font-bold text-blue-600">{formatTime(300 - timeLeft)}</span> with <span className="font-bold text-amber-600">{moves}</span> moves
                </p>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-600">XP Earned</p>
                  <p className="text-3xl font-bold text-amber-600">+{xpEarned}</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setGameState('menu')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                    Play Again
                  </Button>
                  <Button onClick={() => navigate('/games')} variant="outline" className="flex-1">
                    Back to Games
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
