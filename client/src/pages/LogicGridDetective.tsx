import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { useToast } from '@/hooks/useToast';
import { ArrowLeft, HelpCircle, Lightbulb, Star, CheckCircle2, Home, RotateCcw, Trash2 } from 'lucide-react';

/**
 * LogicGridDetective - Kids Edition (Final Clean)
 * Fixes: Removed unused imports (useEffect, useCallback)
 */

// --- Types ---
type CellState = 'unknown' | 'eliminated' | 'confirmed';

type Category = {
  key: string;
  label: string;
  color: string;
  options: { val: string; icon: string }[];
};

type Clue =
  | { type: 'is'; a: { cat: string; opt: string }; b?: { cat: string; opt?: string } }
  | { type: 'isNot'; a: { cat: string; opt: string }; b?: { cat: string; opt?: string } }
  | { type: 'notWith'; a: { cat: string; opt: string }; b: { cat: string; opt: string } }
  | { type: 'text'; text: string };

type Puzzle = {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  categories: Category[];
  clues: Clue[];
};

type Grid = { cells: { [key: string]: CellState } };

// --- DATA ---
const RAW_PUZZLES: Puzzle[] = [
  // --- EASY (3x3) ---
  {
    id: 'p1_fair',
    title: 'School Fair Mystery',
    description: 'Who won which prize eating which snack?',
    difficulty: 'Easy',
    categories: [
      { key: 'Kid', label: 'Kid', color: 'bg-blue-100 text-blue-800', options: [{ val: 'Sam', icon: '👦' }, { val: 'Mia', icon: '👧' }, { val: 'Leo', icon: '🧑' }] },
      { key: 'Prize', label: 'Prize', color: 'bg-purple-100 text-purple-800', options: [{ val: 'Bear', icon: '🧸' }, { val: 'Ball', icon: '⚽' }, { val: 'Car', icon: '🚗' }] },
      { key: 'Snack', label: 'Snack', color: 'bg-orange-100 text-orange-800', options: [{ val: 'Popcorn', icon: '🍿' }, { val: 'Pizza', icon: '🍕' }, { val: 'Donut', icon: '🍩' }] },
    ],
    clues: [
      { type: 'text', text: 'Mia won the Teddy Bear 🧸.' },
      { type: 'is', a: { cat: 'Kid', opt: 'Sam' }, b: { cat: 'Snack', opt: 'Pizza' } },
      { type: 'isNot', a: { cat: 'Prize', opt: 'Car' }, b: { cat: 'Snack', opt: 'Pizza' } },
      { type: 'isNot', a: { cat: 'Kid', opt: 'Leo' }, b: { cat: 'Prize', opt: 'Ball' } },
      { type: 'text', text: 'The kid who ate the Donut 🍩 did not win the Ball ⚽.' },
    ],
  },
  {
    id: 'p8_dino',
    title: 'Dino Dig',
    description: 'Match the dinosaur to its favorite food!',
    difficulty: 'Easy',
    categories: [
      { key: 'Dino', label: 'Dinosaur', color: 'bg-emerald-100 text-emerald-800', options: [{ val: 'T-Rex', icon: '🦖' }, { val: 'Stego', icon: '🦕' }, { val: 'Tricera', icon: '🐊' }] },
      { key: 'Color', label: 'Color', color: 'bg-amber-100 text-amber-800', options: [{ val: 'Green', icon: '🟢' }, { val: 'Brown', icon: '🟤' }, { val: 'Purple', icon: '🟣' }] },
      { key: 'Food', label: 'Food', color: 'bg-lime-100 text-lime-800', options: [{ val: 'Meat', icon: '🍖' }, { val: 'Ferns', icon: '🌿' }, { val: 'Leaves', icon: '🍃' }] },
    ],
    clues: [
      { type: 'is', a: { cat: 'Dino', opt: 'T-Rex' }, b: { cat: 'Food', opt: 'Meat' } },
      { type: 'is', a: { cat: 'Dino', opt: 'Stego' }, b: { cat: 'Color', opt: 'Purple' } },
      { type: 'text', text: 'The Green dinosaur eats Leaves 🍃.' },
      { type: 'isNot', a: { cat: 'Dino', opt: 'Tricera' }, b: { cat: 'Color', opt: 'Brown' } },
    ],
  },
  {
    id: 'p12_icecream',
    title: 'Ice Cream Shop',
    description: 'Sweet treats for everyone!',
    difficulty: 'Easy',
    categories: [
      { key: 'Customer', label: 'Customer', color: 'bg-cyan-100 text-cyan-800', options: [{ val: 'Fox', icon: '🦊' }, { val: 'Cat', icon: '🐱' }, { val: 'Dog', icon: '🐶' }] },
      { key: 'Flavor', label: 'Flavor', color: 'bg-amber-100 text-amber-800', options: [{ val: 'Choco', icon: '🍫' }, { val: 'Vanilla', icon: '🍦' }, { val: 'Strawberry', icon: '🍓' }] },
      { key: 'Topping', label: 'Topping', color: 'bg-red-100 text-red-800', options: [{ val: 'Sprinkles', icon: '✨' }, { val: 'Cherry', icon: '🍒' }, { val: 'Syrup', icon: '🍯' }] },
    ],
    clues: [
      { type: 'is', a: { cat: 'Customer', opt: 'Fox' }, b: { cat: 'Flavor', opt: 'Choco' } },
      { type: 'text', text: 'The Cat 🐱 wants Cherry 🍒 topping.' },
      { type: 'is', a: { cat: 'Flavor', opt: 'Strawberry' }, b: { cat: 'Topping', opt: 'Sprinkles' } },
      { type: 'isNot', a: { cat: 'Customer', opt: 'Dog' }, b: { cat: 'Flavor', opt: 'Vanilla' } },
    ],
  },
  // --- MEDIUM (3x3) ---
  {
    id: 'p3_space',
    title: 'Space Mission',
    description: 'Assign astronauts to their planets and ships!',
    difficulty: 'Medium',
    categories: [
      { key: 'Astro', label: 'Astronaut', color: 'bg-slate-100 text-slate-800', options: [{ val: 'Buzz', icon: '👨‍🚀' }, { val: 'Sally', icon: '👩‍🚀' }, { val: 'Yuri', icon: '🧑‍🚀' }] },
      { key: 'Planet', label: 'Planet', color: 'bg-indigo-100 text-indigo-800', options: [{ val: 'Mars', icon: '🪐' }, { val: 'Venus', icon: '🌕' }, { val: 'Moon', icon: '🌑' }] },
      { key: 'Ship', label: 'Ship', color: 'bg-blue-100 text-blue-800', options: [{ val: 'Rocket', icon: '🚀' }, { val: 'Shuttle', icon: '🛸' }, { val: 'Probe', icon: '🛰️' }] },
    ],
    clues: [
      { type: 'is', a: { cat: 'Astro', opt: 'Buzz' }, b: { cat: 'Planet', opt: 'Mars' } },
      { type: 'is', a: { cat: 'Astro', opt: 'Sally' }, b: { cat: 'Ship', opt: 'Shuttle' } },
      { type: 'isNot', a: { cat: 'Planet', opt: 'Moon' }, b: { cat: 'Ship', opt: 'Rocket' } },
      { type: 'text', text: 'The Shuttle did not go to Mars.' },
      { type: 'isNot', a: { cat: 'Astro', opt: 'Yuri' }, b: { cat: 'Ship', opt: 'Rocket' } },
    ],
  },
  {
    id: 'p4_magic',
    title: 'Magic Potions',
    description: 'Which wizard brewed which potion?',
    difficulty: 'Medium',
    categories: [
      { key: 'Wizard', label: 'Wizard', color: 'bg-purple-100 text-purple-800', options: [{ val: 'Merlin', icon: '🧙‍♂️' }, { val: 'Wanda', icon: '🧙‍♀️' }, { val: 'Gandalf', icon: '🧔' }] },
      { key: 'Color', label: 'Color', color: 'bg-pink-100 text-pink-800', options: [{ val: 'Green', icon: '🟢' }, { val: 'Blue', icon: '🔵' }, { val: 'Red', icon: '🔴' }] },
      { key: 'Effect', label: 'Effect', color: 'bg-yellow-100 text-yellow-800', options: [{ val: 'Fly', icon: '🕊️' }, { val: 'Invisibility', icon: '👻' }, { val: 'Strength', icon: '💪' }] },
    ],
    clues: [
      { type: 'is', a: { cat: 'Wizard', opt: 'Merlin' }, b: { cat: 'Effect', opt: 'Fly' } },
      { type: 'isNot', a: { cat: 'Wizard', opt: 'Wanda' }, b: { cat: 'Color', opt: 'Red' } },
      { type: 'text', text: 'The Blue potion gives Strength 💪.' },
      { type: 'is', a: { cat: 'Wizard', opt: 'Gandalf' }, b: { cat: 'Color', opt: 'Green' } },
      { type: 'isNot', a: { cat: 'Effect', opt: 'Fly' }, b: { cat: 'Color', opt: 'Red' } },
    ],
  },
  // --- HARD (4x4) ---
  {
    id: 'p11_pirate_hard',
    title: 'Pirate Treasure',
    description: '4 Pirates, 4 Islands, 4 Treasures! Can you solve it?',
    difficulty: 'Hard',
    categories: [
      { key: 'Pirate', label: 'Pirate', color: 'bg-gray-200 text-gray-800', options: [{ val: 'Hook', icon: '🪝' }, { val: 'Beard', icon: '🏴‍☠️' }, { val: 'Red', icon: '🧣' }, { val: 'Jack', icon: '🦜' }] },
      { key: 'Island', label: 'Island', color: 'bg-green-100 text-green-800', options: [{ val: 'Skull', icon: '💀' }, { val: 'Palm', icon: '🌴' }, { val: 'Volcano', icon: '🌋' }, { val: 'Cave', icon: '🕳️' }] },
      { key: 'Loot', label: 'Loot', color: 'bg-yellow-100 text-yellow-800', options: [{ val: 'Gold', icon: '💰' }, { val: 'Gem', icon: '💎' }, { val: 'Map', icon: '🗺️' }, { val: 'Sword', icon: '⚔️' }] },
    ],
    clues: [
      { type: 'is', a: { cat: 'Pirate', opt: 'Hook' }, b: { cat: 'Loot', opt: 'Map' } },
      { type: 'isNot', a: { cat: 'Pirate', opt: 'Red' }, b: { cat: 'Island', opt: 'Palm' } },
      { type: 'is', a: { cat: 'Island', opt: 'Volcano' }, b: { cat: 'Loot', opt: 'Gem' } },
      { type: 'isNot', a: { cat: 'Pirate', opt: 'Beard' }, b: { cat: 'Island', opt: 'Skull' } },
      { type: 'text', text: 'Jack buried the Sword ⚔️.' },
      { type: 'isNot', a: { cat: 'Pirate', opt: 'Jack' }, b: { cat: 'Island', opt: 'Palm' } },
      { type: 'is', a: { cat: 'Loot', opt: 'Gold' }, b: { cat: 'Island', opt: 'Cave' } },
      { type: 'isNot', a: { cat: 'Pirate', opt: 'Red' }, b: { cat: 'Loot', opt: 'Gold' } },
    ],
  },
  {
    id: 'p13_alien_hard',
    title: 'Alien Signals',
    description: 'Decide which Alien is sending which Signal from which Star!',
    difficulty: 'Hard',
    categories: [
      { key: 'Alien', label: 'Alien', color: 'bg-green-200 text-green-900', options: [{ val: 'Zorg', icon: '👽' }, { val: 'Glep', icon: '👾' }, { val: 'Bloop', icon: '🤖' }, { val: 'Klaatu', icon: '🧟' }] },
      { key: 'Star', label: 'Star', color: 'bg-indigo-100 text-indigo-900', options: [{ val: 'Alpha', icon: '⭐' }, { val: 'Beta', icon: '🌟' }, { val: 'Gamma', icon: '✨' }, { val: 'Delta', icon: '💫' }] },
      { key: 'Signal', label: 'Signal', color: 'bg-pink-100 text-pink-900', options: [{ val: 'Beep', icon: '📡' }, { val: 'Wave', icon: '📻' }, { val: 'Pulse', icon: '🔊' }, { val: 'Hum', icon: '📢' }] },
    ],
    clues: [
      { type: 'is', a: { cat: 'Alien', opt: 'Zorg' }, b: { cat: 'Star', opt: 'Alpha' } },
      { type: 'isNot', a: { cat: 'Alien', opt: 'Glep' }, b: { cat: 'Signal', opt: 'Hum' } },
      { type: 'is', a: { cat: 'Star', opt: 'Delta' }, b: { cat: 'Signal', opt: 'Wave' } },
      { type: 'isNot', a: { cat: 'Alien', opt: 'Bloop' }, b: { cat: 'Star', opt: 'Gamma' } },
      { type: 'text', text: 'Klaatu is not at Star Beta.' },
      { type: 'is', a: { cat: 'Alien', opt: 'Glep' }, b: { cat: 'Signal', opt: 'Pulse' } },
      { type: 'isNot', a: { cat: 'Star', opt: 'Beta' }, b: { cat: 'Signal', opt: 'Hum' } },
      { type: 'text', text: 'The Signal from Gamma is a Hum 📢.' },
    ],
  },
];

const storageKey = (puzzleId: string) => `logicgrid_kids_v8_${puzzleId}`;

// --- HELPERS ---

// Shuffle Helper
function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Generate a randomized puzzle instance
function createRandomizedPuzzle(original: Puzzle): Puzzle {
  return {
    ...original,
    categories: original.categories.map(cat => ({
      ...cat,
      options: shuffle(cat.options) // Shuffle options only
    }))
  };
}

function buildInitialCells(p: Puzzle): Grid {
  const cells: { [key: string]: CellState } = {};
  for (let i = 0; i < p.categories.length; i++) {
    for (let j = i + 1; j < p.categories.length; j++) {
      const catA = p.categories[i];
      const catB = p.categories[j];
      for (let a = 0; a < catA.options.length; a++) {
        for (let b = 0; b < catB.options.length; b++) {
          cells[cellKey(catA.key, a, catB.key, b)] = 'unknown';
        }
      }
    }
  }
  return { cells };
}

function cellKey(catA: string, idxA: number, catB: string, idxB: number) {
  return `${catA}:${idxA}|${catB}:${idxB}`;
}

// Minimal Solver: Only does Row/Column Exclusions. 
// Does NOT use clues. Does NOT use transitive logic.
function minimalPropagate(p: Puzzle, gridIn: Grid): Grid {
  const cats = p.categories;
  const grid: Grid = { cells: { ...gridIn.cells } };
  
  // Only 1 pass needed for basic exclusion propagation per click
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const catA = cats[i];
      const catB = cats[j];
      for (let a = 0; a < catA.options.length; a++) {
        for (let b = 0; b < catB.options.length; b++) {
          const k = cellKey(catA.key, a, catB.key, b);
          if (grid.cells[k] === 'confirmed') {
            // Eliminate other B's for this A
            for (let ob = 0; ob < catB.options.length; ob++) {
              if (ob !== b) {
                const badK = cellKey(catA.key, a, catB.key, ob);
                if (grid.cells[badK] === 'unknown') grid.cells[badK] = 'eliminated';
              }
            }
            // Eliminate other A's for this B
            for (let oa = 0; oa < catA.options.length; oa++) {
              if (oa !== a) {
                const badK = cellKey(catA.key, oa, catB.key, b);
                if (grid.cells[badK] === 'unknown') grid.cells[badK] = 'eliminated';
              }
            }
          }
        }
      }
    }
  }
  return grid;
}

function checkSolved(p: Puzzle, grid: Grid) {
  for (let i = 0; i < p.categories.length; i++) {
    for (let j = i + 1; j < p.categories.length; j++) {
      const catA = p.categories[i];
      const catB = p.categories[j];
      for (let a = 0; a < catA.options.length; a++) {
        let yes = 0;
        for (let b = 0; b < catB.options.length; b++) {
          if (grid.cells[cellKey(catA.key, a, catB.key, b)] === 'confirmed') yes++;
        }
        if (yes !== 1) return false;
      }
    }
  }
  return true;
}

// --- COMPONENTS ---
function TutorialOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
      <Card className="max-w-md w-full border-4 border-yellow-400 bg-white shadow-2xl">
        <CardHeader className="bg-yellow-50 text-center pb-4">
          <CardTitle className="text-2xl text-yellow-700">How to Play 🎓</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-lg text-red-600 text-2xl font-bold border-2 border-red-200">✗</div>
            <div>
              <p className="font-bold text-gray-900">Tap once for "No"</p>
              <p className="text-sm text-gray-500">When clues say two things don't match.</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-lg text-green-600 text-2xl font-bold border-2 border-green-200">✓</div>
             <div>
               <p className="font-bold text-gray-900">Tap twice for "Yes"</p>
               <p className="text-sm text-gray-500">When you are sure they match!</p>
             </div>
          </div>
          <Button onClick={onClose} className="w-full h-12 text-lg font-bold bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl">Got it!</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function WinModal({ onRestart, onExit }: { onRestart: () => void, onExit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in zoom-in-50">
       <Card className="max-w-sm w-full border-4 border-green-400 bg-white shadow-2xl">
        <CardContent className="text-center pt-10 pb-10">
           <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
             <Star className="w-12 h-12 text-yellow-500 fill-yellow-500" />
           </div>
           <h2 className="text-3xl font-extrabold text-green-700 mb-2">You Did It!</h2>
           <p className="text-gray-600 mb-8">You are a Master Detective!</p>
           <div className="space-y-3">
             <Button onClick={onRestart} className="w-full h-12 text-lg font-bold bg-green-500 hover:bg-green-600 text-white rounded-xl">
               <RotateCcw className="w-5 h-5 mr-2" /> Play Again
             </Button>
             <Button onClick={onExit} variant="outline" className="w-full h-12 text-lg font-bold border-2 rounded-xl">
               <Home className="w-5 h-5 mr-2" /> Menu
             </Button>
           </div>
        </CardContent>
       </Card>
    </div>
  );
}

// --- MAIN APP ---
export function LogicGridDetective() {
  const { toast } = useToast();
  const [mode, setMode] = useState<'menu' | 'playing'>('menu');
  
  // We hold the *active* puzzle state here, which might be a randomized version of the RAW_PUZZLES
  const [activePuzzle, setActivePuzzle] = useState<Puzzle>(RAW_PUZZLES[0]);
  const [puzzleIndex, setPuzzleIndex] = useState(0);

  const [grid, setGrid] = useState<Grid>(() => buildInitialCells(RAW_PUZZLES[0]));
  const [showTutorial, setShowTutorial] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // START GAME
  function startGame(idx: number, forceReset = false) {
    setPuzzleIndex(idx);
    
    // Create a fresh randomized version of the puzzle logic
    const basePuzzle = RAW_PUZZLES[idx];
    const randomized = createRandomizedPuzzle(basePuzzle);
    setActivePuzzle(randomized);

    const saved = localStorage.getItem(storageKey(basePuzzle.id));

    if (forceReset) {
      localStorage.removeItem(storageKey(basePuzzle.id));
      setGrid(buildInitialCells(randomized));
    } else if (saved) {
       // Note: If saving/loading is required for randomized puzzles, we'd need to store the randomized puzzle state too.
       // For this simplified kid's version, we prioritize a fresh fun start or a simple reset.
       setGrid(buildInitialCells(randomized));
    } else {
       setGrid(buildInitialCells(randomized));
       if (idx === 0) setShowTutorial(true);
    }
    setIsWon(false);
    setMode('playing');
  }

  function restartLevel() {
    if (confirm("Do you want to shuffle and restart?")) {
      startGame(puzzleIndex, true);
    }
  }

  function toggleCell(catAIdx: number, optAIdx: number, catBIdx: number, optBIdx: number) {
    if (isWon) return;
    const catA = activePuzzle.categories[catAIdx];
    const catB = activePuzzle.categories[catBIdx];
    const key = catAIdx < catBIdx 
      ? cellKey(catA.key, optAIdx, catB.key, optBIdx) 
      : cellKey(catB.key, optBIdx, catA.key, optAIdx);

    setGrid(prev => {
      const curr = prev.cells[key] || 'unknown';
      const next: CellState = curr === 'unknown' ? 'eliminated' : (curr === 'eliminated' ? 'confirmed' : 'unknown');
      const newGrid: Grid = { cells: { ...prev.cells, [key]: next } };
      
      // Use minimal propagation (only row/col, no clues, no transitive)
      const propagated = minimalPropagate(activePuzzle, newGrid);
      
      return propagated;
    });
  }

  function handleCheck() {
    if (checkSolved(activePuzzle, grid)) setIsWon(true);
    else toast({ title: "Keep trying!", description: "There are still some missing links.", variant: "destructive" });
  }

  const renderCell = (catAIdx: number, optAIdx: number, catBIdx: number, optBIdx: number) => {
    let val: CellState = 'unknown';
    // Access activePuzzle categories (which are shuffled)
    const catA = activePuzzle.categories[catAIdx];
    const catB = activePuzzle.categories[catBIdx];
    
    if (catAIdx < catBIdx) {
       val = grid.cells[cellKey(catA.key, optAIdx, catB.key, optBIdx)] || 'unknown';
    } else {
       val = grid.cells[cellKey(catB.key, optBIdx, catA.key, optAIdx)] || 'unknown';
    }

    let content = <div className="w-2 h-2 rounded-full bg-gray-200" />;
    let bg = "bg-white";
    if (val === 'eliminated') {
      content = <span className="text-red-400 font-bold text-lg leading-none">✕</span>;
      bg = "bg-red-50";
    } else if (val === 'confirmed') {
      content = <span className="text-green-600 font-bold text-xl leading-none">✓</span>;
      bg = "bg-green-100";
    }

    return (
      <button 
        key={`${catAIdx}-${optAIdx}-${catBIdx}-${optBIdx}`}
        onClick={() => toggleCell(catAIdx, optAIdx, catBIdx, optBIdx)}
        className={`w-full h-10 sm:h-12 border border-gray-200 flex items-center justify-center transition-colors hover:bg-gray-50 ${bg}`}
      >
        {content}
      </button>
    );
  };

  // MENU
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-indigo-50 p-6 flex flex-col items-center justify-center">
         <div className="max-w-6xl w-full">
            <h1 className="text-4xl md:text-6xl font-black text-indigo-900 text-center mb-4 tracking-tight">Logic Detective 🕵️</h1>
            <p className="text-center text-indigo-600 text-xl mb-12">Choose a mystery to solve!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {RAW_PUZZLES.map((p, i) => (
                 <div key={p.id} className="bg-white rounded-3xl p-6 shadow-xl border-4 border-indigo-100 hover:border-indigo-400 hover:scale-105 transition-all group cursor-pointer flex flex-col" onClick={() => startGame(i, true)}>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${p.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : p.difficulty === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{p.difficulty}</span>
                      <span className="text-2xl">{p.categories[0].options[0].icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{p.title}</h3>
                    <p className="text-gray-500 mb-6 text-sm flex-grow">{p.description}</p>
                    <div className="flex items-center text-indigo-500 font-bold text-sm">
                       Play Now <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  // PLAYING
  const navigate = useNavigate();
  const cat0 = activePuzzle.categories[0];
  const cat1 = activePuzzle.categories[1];
  const cat2 = activePuzzle.categories[2];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
       {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
       {isWon && <WinModal onRestart={() => startGame(puzzleIndex, true)} onExit={() => setMode('menu')} />}

       <div className="bg-white sticky top-0 z-40 border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setMode('menu')} className="hover:bg-gray-100 rounded-full">
               <ArrowLeft className="w-6 h-6 text-slate-600" />
             </Button>
             <h2 className="text-lg font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md">{activePuzzle.title}</h2>
          </div>
          <div className="flex gap-2">
             <Button size="sm" variant="outline" onClick={() => navigate('/games')} className="rounded-full text-blue-600 border-blue-200 hover:bg-blue-50 hidden sm:flex">
               <Home className="w-4 h-4 mr-1" /> Games
             </Button>
             <Button size="sm" variant="outline" onClick={restartLevel} className="rounded-full text-red-600 border-red-200 hover:bg-red-50">
               <Trash2 className="w-4 h-4 mr-1" /> Reset
             </Button>
             <Button size="sm" variant="outline" onClick={() => setShowTutorial(true)} className="rounded-full hidden sm:flex">
               <HelpCircle className="w-4 h-4 mr-1" /> Help
             </Button>
             <Button size="sm" onClick={handleCheck} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
               <CheckCircle2 className="w-5 h-5 mr-1" /> Submit
             </Button>
          </div>
       </div>

       <div className="max-w-7xl mx-auto p-4 lg:p-6 grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-20 lg:h-[calc(100vh-100px)] flex flex-col">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col max-h-full">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                   <h3 className="text-lg font-bold text-gray-800 flex items-center">
                     <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" /> Clues
                   </h3>
                   <span className="text-xs font-bold text-gray-400 uppercase">{activePuzzle.clues.length} hints</span>
                </div>
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                   {activePuzzle.clues.map((c, i) => (
                      <div key={i} className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed text-slate-700 transition-all hover:bg-indigo-50 hover:border-indigo-100">
                         <div className="flex gap-2">
                           <span className="font-bold text-indigo-400 shrink-0">{i+1}.</span>
                           {c.type === 'text' ? (
                             <span>{c.text}</span>
                           ) : (
                             <span>
                               <span className="font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-800 inline-block mb-1">{c.a.opt}</span>
                               {c.type === 'isNot' || c.type === 'notWith' ? <span className="text-red-500 font-extrabold mx-1.5">is NOT</span> : <span className="text-green-600 font-extrabold mx-1.5">IS</span>}
                               <span className="font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-800 inline-block">{c.b?.opt}</span>
                             </span>
                           )}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="lg:col-span-8 overflow-x-auto pb-10">
             <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 inline-block min-w-full">
                <div className="grid gap-1" style={{ 
                    gridTemplateColumns: `auto repeat(${cat1.options.length}, minmax(44px, 1fr)) 24px repeat(${cat2.options.length}, minmax(44px, 1fr))` 
                }}>
                   <div className="h-28"></div>
                   {cat1.options.map((o) => (
                     <div key={o.val} className="flex flex-col justify-end items-center pb-3 relative group">
                        <span className="text-2xl mb-2 z-10 group-hover:scale-110 transition-transform">{o.icon}</span>
                        <div className={`text-[10px] sm:text-xs font-bold uppercase [writing-mode:vertical-lr] py-1.5 px-1 rounded-md ${cat1.color.split(' ')[1]} bg-opacity-10 w-6 flex items-center justify-center h-20`}>
                          {o.val}
                        </div>
                     </div>
                   ))}
                   <div className="w-6"></div>
                   {cat2.options.map((o) => (
                     <div key={o.val} className="flex flex-col justify-end items-center pb-3 relative group">
                        <span className="text-2xl mb-2 z-10 group-hover:scale-110 transition-transform">{o.icon}</span>
                        <div className={`text-[10px] sm:text-xs font-bold uppercase [writing-mode:vertical-lr] py-1.5 px-1 rounded-md ${cat2.color.split(' ')[1]} bg-opacity-10 w-6 flex items-center justify-center h-20`}>
                          {o.val}
                        </div>
                     </div>
                   ))}

                   {cat0.options.map((opt0, idx0) => (
                      <>
                        <div className="flex items-center justify-end pr-4 h-12">
                           <span className={`text-xs font-bold mr-3 ${cat0.color.split(' ')[1]}`}>{opt0.val}</span>
                           <span className="text-3xl filter drop-shadow-sm">{opt0.icon}</span>
                        </div>
                        {cat1.options.map((_, idx1) => renderCell(0, idx0, 1, idx1))}
                        <div className="w-6 bg-slate-50 rounded-sm"></div>
                        {cat2.options.map((_, idx2) => renderCell(0, idx0, 2, idx2))}
                      </>
                   ))}

                   <div className="h-6 col-span-full"></div>

                   {cat1.options.map((opt1, idx1) => (
                     <>
                        <div className="flex items-center justify-end pr-4 h-12">
                           <span className={`text-xs font-bold mr-3 ${cat1.color.split(' ')[1]}`}>{opt1.val}</span>
                           <span className="text-3xl filter drop-shadow-sm">{opt1.icon}</span>
                        </div>
                        {cat1.options.map((_, __) => <div className="bg-slate-50/30 rounded-sm"></div>)}
                        <div className="w-6 bg-slate-50 rounded-sm"></div>
                        {cat2.options.map((_, idx2) => renderCell(1, idx1, 2, idx2))}
                     </>
                   ))}
                </div>
                <div className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-8 text-xs text-gray-500 font-bold uppercase tracking-widest border-t border-gray-100 pt-6">
                   <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                      <div className={`w-3 h-3 rounded-full ${cat0.color.split(' ')[0].replace('bg-', 'bg-')}`}></div> 
                      <span className={cat0.color.split(' ')[1]}>{cat0.label}</span>
                   </div>
                   <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                      <div className={`w-3 h-3 rounded-full ${cat1.color.split(' ')[0]}`}></div> 
                      <span className={cat1.color.split(' ')[1]}>{cat1.label}</span>
                   </div>
                   <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                      <div className={`w-3 h-3 rounded-full ${cat2.color.split(' ')[0]}`}></div> 
                      <span className={cat2.color.split(' ')[1]}>{cat2.label}</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}