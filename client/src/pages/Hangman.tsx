import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { submitSpeedType } from '@/api/speedtype';

// Word list for Hangman
const HANGMAN_WORDS = [
  'adventure','algorithm','beautiful','believe','breakfast','brilliant','butterfly',
  'calendar','challenge','champion','character','chocolate','christmas','classroom',
  'communication','community','company','computer','confidence','connection','constant',
  'conversation','courage','creative','critical','curiosity','dangerous','decision',
  'definition','delicious','democracy','description','diamond','different','difficult',
  'dinosaur','direction','disaster','discipline','discovery','discussion','disease',
  'distance','division','document','education','effective','efficiency','elaborate',
  'election','electricity','elementary','elephant','eliminate','emergency','emotion',
  'emphasis','employment','encourage','encyclopedia','energy','engagement','engineer',
  'enhancement','enjoyment','environment','equipment','equivalent','especially','essential',
  'establish','establishment','estimate','evaluation','eventual','everything','evidence',
  'evolution','examination','example','excellent','exception','excitement','exercise',
  'exhaustive','existence','experience','experiment','explanation','exploration','explosion',
  'expression','extension','extraordinary','extreme','eyewitness','fabrication','facility',
  'fallacy','familiar','fantastic','farewell','fascinating','federation','ferocious',
  'festival','fidgeting','figurative','financial','fireplace','firmament','fishing',
  'flexibility','flourish','flowering','foolishness','football','forecast','forehead',
  'foreground','foreigner','foresight','forestry','forever','forgiving','formality',
  'formation','formerly','formulate','fortress','fortunate','fountain','fragile',
  'framework','frankness','fraudulent','freakish','frequency','freshman','friendship',
  'frighten','frivolous','frolicking','frontier','frosting','fruitful','frustrated',
  'fulfillment','fullness','function','functional','fundamental','funny','furniture',
  'furthermore','furtherance','furtive','fusion','futility','gadgetry','gallantry',
  'galvanize','gambling','gangster','garbage','gardening','garment','garrison',
  'gasp','gastric','gateway','gathered','gathering','gaudy','gaunt','gauze','gazelle',
  'gazette','gelatine','gelatin','gelatinous','gemstone','genealogy','generator',
  'generous','genesis','genetics','genial','genitive','genius','genocide','genre',
  'genteel','gentile','gentle','gentleman','gentlemen','gentleness','gently','genuine',
  'genuineness','geography','geological','geologist','geometry','geranium','germane',
  'german','germany','germinal','germinate','germination','gestation','gesture','getting',
  'ghastly','ghost','ghostly','ghostwriter','ghoulish','giant','giantess','gibberish',
  'gibbet','gibbon','gibe','giddy','gigantic','giggle','gild','gilded','gilder','gilding',
  'gill','gillyflower','gilt','gimcrack','gimlet','gimmick','gimp','gin','ginger','gingerly',
  'gingham','giraffe','gird','girder','girdle','girl','girlfriend','girlhood','girlish',
  'girt','girth','gist','give','giveback','given','giver','giving','gizzard','glacial',
  'glacier','glad','gladden','glade','gladiator','gladly','gladness','glamor','glamorous',
  'glamour','glance','gland','glandular','glare','glaring','glass','glassful','glassware',
  'glassy','glaucoma','glaze','glazier','glazing','gleam','glean','gleaning','glee','gleeful',
  'glen','glib','glibly','glibness','glide','glider','gliding','glimmer','glimpse','glint',
  'glitch','glitter','glittering','gloat','gloating','global','globalize','globally','globe',
  'globular','globule','gloom','gloomy','glorification','glorified','glorify','glorious',
  'gloriously','glory','gloss','glossary','glosser','glossy','glottal','glottis','glove',
  'glow','glowing','glowworm','glucose','glue','gluey','glum','glumly','glumness','glut',
  'glutamate','glutamic','gluten','gluteus','glutinous','glutton','gluttony','glycerin',
  'glycerine','glycerol','glycogen','glyph','gnarled','gnash','gnat','gnaw','gnawed','gnawing',
  'gneiss','gnome','gnu','goad','goal','goaltender','goat','goatee','goatherd','goatskin',
  'gobbet','gobble','gobbledygook','gobbler','goblet','goblin','gobstoppers','god','godchild',
  'goddamn','goddamned','goddess','godfather','godfearing','godforsaken','godless','godlike',
  'godliness','godly','godmother','godparent','godsend','godson','godsped','goes','gofer',
  'goggle','goggles','going','goings','goiter','goitrous','gold','goldbeater','goldbeating',
  'goldbricker','golden','goldeneye','goldenrod','goldenrule','goldfinch','goldfish','goldilocks',
  'goldsmith','goldstandard','goldstone','goldthread','golf','golfball','golfclub','golfer',
  'golfing','goliath','gonad','gondola','gondolier','gone','goner','gonfalon','gonfalonier',
  'gong','gonorrhea','gonzo','good','goodbye','goodby','goodbyes','goodfellow','goodfor',
  'goodfornothing','goodhearted','goodhumored','goodish','goodliness','goodly','goodman',
  'goodnatured','goodness','goods','goodsized','goodsport','goodtемpered','goodwife','goodwill',
  'goody','goodye','gooey','goof','goofball','goofy','gook','goon','goony','goonsquad',
  'goose','gooseberry','gooseflesh','goosefoot','gooseherd','gooseneck','goosestep','gopher',
  'gopherwood','goral','gorblimey','gorcrow','gordian','gore','gorge','gorgeous','gorgeously',
  'gorgeousness','gorgon','gorgoneion','gorgonize','gorgonzola','gorgonzolacheese','gorhens',
  'gorhenly','gorhen','gorhens','gori','goria','goriest','gorily','goriness','gorings',
  'gormamdize','gormand','gormandise','gormandize','gormandizer','gormless','gorp','gorped',
  'gorping','gorse','gorsedd','gorsier','gorsiest','gorsy','gory','gosh','gosling','gospel',
  'gospeler','gospeller','gospellike','gospelminded','gospelmusic','gospeltruth','gospelize',
  'gossamer','gossamery','gossip','gossipmonger','gossiped','gossiper','gossipers','gossiping',
  'gossipingly','gossipry','gossips','gossipy','gossoon','got','gotcha','gothic','gotico',
  'gothicism','gotta','gotten','gouge','gouged','gouger','gouges','gouging','goulash','goura',
  'gourami','gourd','gourmand','gourmandise','gourmandize','gourmandizer','gourmet','gourmetia'
];

type GameState = 'playing' | 'won' | 'lost';

interface HangmanStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  totalXP: number;
  lastPlayedDate: string;
}

const MAX_WRONG_GUESSES = 6;
const HANGMAN_STAGES = [
  `
    ------
    |    |
    |
    |
    |
    |
    --------
  `,
  `
    ------
    |    |
    |    O
    |
    |
    |
    --------
  `,
  `
    ------
    |    |
    |    O
    |    |
    |
    |
    --------
  `,
  `
    ------
    |    |
    |    O
    |   \\|
    |
    |
    --------
  `,
  `
    ------
    |    |
    |    O
    |   \\|/
    |
    |
    --------
  `,
  `
    ------
    |    |
    |    O
    |   \\|/
    |    |
    |
    --------
  `,
  `
    ------
    |    |
    |    O
    |   \\|/
    |    |
    |   / \\
    --------
  `,
];

export function Hangman() {
  const navigate = useNavigate();

  const [targetWord, setTargetWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [gameState, setGameState] = useState<GameState>('playing');
  const [wrongGuesses, setWrongGuesses] = useState(0);

  const [stats, setStats] = useState<HangmanStats>(() => {
    try {
      const raw = localStorage.getItem('hangmanStats');
      if (raw) return JSON.parse(raw) as HangmanStats;
    } catch {}
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalXP: 0,
      lastPlayedDate: '',
    };
  });

  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const gameStateRef = useRef<GameState>('playing');
  const wrongGuessesRef = useRef(0);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    wrongGuessesRef.current = wrongGuesses;
  }, [wrongGuesses]);

  // Initialize game
  useEffect(() => {
    const word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)].toUpperCase();
    setTargetWord(word);
    setGuessedLetters(new Set());
    setGameState('playing');
    setWrongGuesses(0);
  }, []);

  // Check win/loss condition
  useEffect(() => {
    if (gameState !== 'playing') return;

    const guessed = Array.from(guessedLetters);
    const wordLetters = new Set(targetWord.split(''));
    const allGuessed = Array.from(wordLetters).every(letter => guessed.includes(letter));

    if (allGuessed) {
      setGameState('won');
      updateStats(true, wrongGuesses);
    } else if (wrongGuesses >= MAX_WRONG_GUESSES) {
      setGameState('lost');
      updateStats(false, wrongGuesses);
    }
  }, [guessedLetters, wrongGuesses, gameState, targetWord]);

  const updateStats = async (won: boolean, wrongCount: number) => {
    // Calculate XP based on wrong guesses
    // 0 wrong = 100 XP (perfect!)
    // 1 wrong = 80 XP
    // 2 wrong = 60 XP
    // 3 wrong = 40 XP
    // 4 wrong = 30 XP
    // 5 wrong = 20 XP
    // 6 wrong (lost) = 10 XP
    const xpTable: { [key: number]: number } = {
      0: 100,
      1: 80,
      2: 60,
      3: 40,
      4: 30,
      5: 20,
      6: 10,
    };
    
    const xp = won ? (xpTable[wrongCount] || 10) : 10;
    setXpEarned(xp);

    const newStats: HangmanStats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      gamesWon: won ? stats.gamesWon + 1 : stats.gamesWon,
      currentStreak: won ? stats.currentStreak + 1 : 0,
      maxStreak: won ? Math.max(stats.maxStreak, stats.currentStreak + 1) : stats.maxStreak,
      totalXP: stats.totalXP + xp,
      lastPlayedDate: new Date().toISOString(),
    };

    setStats(newStats);
    localStorage.setItem('hangmanStats', JSON.stringify(newStats));

    try {
      // Calculate WPM and accuracy based on performance
      const wpm = won ? Math.max(20, 50 - (wrongCount * 5)) : 15;
      const accuracy = won ? Math.max(50, 95 - (wrongCount * 10)) : 40;
      
      await submitSpeedType({
        difficulty: 'medium',
        wpm,
        accuracy,
        wordsCorrect: won ? 1 : 0,
        totalWords: 1,
      });
    } catch (err) {
      console.error('Failed to submit Hangman score:', err);
    }
  };

  const handleGuess = (letter: string) => {
    if (gameStateRef.current !== 'playing' || guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!targetWord.includes(letter)) {
      setWrongGuesses(wrongGuessesRef.current + 1);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (gameState !== 'playing') return;

    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter) && !guessedLetters.has(letter)) {
      e.preventDefault();
      handleGuess(letter);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [guessedLetters, gameState]);

  const displayWord = targetWord
    .split('')
    .map(letter => (guessedLetters.has(letter) ? letter : '_'))
    .join(' ');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const newGame = () => {
    const word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)].toUpperCase();
    setTargetWord(word);
    setGuessedLetters(new Set());
    setGameState('playing');
    setWrongGuesses(0);
    setXpEarned(0);
  };

  if (showHelp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-blue-600">How to Play Hangman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-bold mb-2 text-blue-600">Objective</h3>
              <p>Guess the hidden word by selecting letters. You have {MAX_WRONG_GUESSES} wrong guesses before the game is over.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-blue-600">How It Works</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>A random word is hidden and displayed as blanks</li>
                <li>Click on letters or use your keyboard to guess</li>
                <li>Each correct letter is revealed in the word</li>
                <li>Each wrong guess adds a body part to the hangman</li>
                <li>Win by guessing all letters before running out of guesses</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-blue-600">Scoring</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Win: <span className="text-amber-600 font-semibold">+50 XP</span></li>
                <li>Loss: <span className="text-amber-600 font-semibold">+10 XP</span></li>
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
            <CardTitle className="text-amber-600">Hangman Statistics</CardTitle>
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
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center col-span-2">
                <p className="text-2xl font-bold text-orange-600">{stats.totalXP}</p>
                <p className="text-sm text-gray-600">Total XP Earned</p>
              </div>
            </div>
            <Button onClick={() => setShowStats(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Back to Game</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/games')}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-3xl font-bold text-foreground">Hangman</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hangman Drawing */}
          <div className="md:col-span-1 flex justify-center">
            <div className="bg-white border border-gray-200 p-8 rounded-lg">
              <pre className="text-gray-800 font-mono text-lg leading-tight whitespace-pre">
                {HANGMAN_STAGES[wrongGuesses]}
              </pre>
              <p className="text-center text-gray-700 mt-6 font-semibold text-lg">
                Wrong: <span className="text-red-600 text-xl">{wrongGuesses}/{MAX_WRONG_GUESSES}</span>
              </p>
            </div>
          </div>

          {/* Word and Guesses */}
          <div className="md:col-span-2 space-y-6">
            {/* Hidden Word */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-5xl font-mono font-bold text-blue-600 tracking-widest mb-4">
                    {displayWord}
                  </p>
                  <p className="text-gray-600">
                    Word length: <span className="text-blue-600 font-semibold">{targetWord.length} letters</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Game Status */}
            {gameState === 'won' && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md bg-white">
                  <CardContent className="pt-8">
                    <div className="text-center">
                      <p className="text-5xl mb-4">🎉</p>
                      <p className="text-3xl font-bold text-emerald-600 mb-2">You Won!</p>
                      <p className="text-emerald-700 mb-6">The word was: <span className="font-bold text-emerald-800 text-lg">{targetWord}</span></p>
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-600">XP Earned</p>
                        <p className="text-3xl font-bold text-amber-600">+{xpEarned}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={newGame} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                          New Game
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

            {gameState === 'lost' && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md bg-white">
                  <CardContent className="pt-8">
                    <div className="text-center">
                      <p className="text-5xl mb-4">💀</p>
                      <p className="text-3xl font-bold text-red-600 mb-2">Game Over</p>
                      <p className="text-red-700 mb-6">The word was: <span className="font-bold text-red-800 text-lg">{targetWord}</span></p>
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-600">XP Earned</p>
                        <p className="text-3xl font-bold text-amber-600">+{xpEarned}</p>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={newGame} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                          Try Again
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

            {/* Alphabet */}
            <div>
              <p className="text-gray-700 mb-3 font-semibold">Guessed Letters:</p>
              <div className="grid grid-cols-7 gap-2">
                {alphabet.map(letter => (
                  <button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={guessedLetters.has(letter) || gameState !== 'playing'}
                    className={`
                      p-2 rounded font-bold text-sm transition-all
                      ${guessedLetters.has(letter)
                        ? targetWord.includes(letter)
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-red-600 text-white cursor-default'
                        : gameState === 'playing'
                        ? 'bg-gray-100 border border-gray-300 text-gray-900 hover:bg-blue-100 cursor-pointer font-semibold'
                        : 'bg-gray-200 text-gray-500 cursor-default'
                      }
                    `}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
