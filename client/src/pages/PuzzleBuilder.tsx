import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowLeft, Trophy, Map as MapIcon, GripVertical, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { submitSpeedType } from '@/api/speedtype';

// --- Types ---

interface PuzzleStats {
  gamesPlayed: number;
  puzzlesSolved: number;
  totalXP: number;
}

interface MapRegion {
  id: string; 
  name: string;
  color: string;
  path: string; 
}

interface MapPuzzle {
  id: number;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  regions: MapRegion[];
  timeLimit: number;
  xpReward: number;
  themeColor: string;
}

// --- DATA: ALL INDIA STATES (Simplified Polygons for Gameplay) ---
// ViewBox: 0 0 1000 1000

// 1. NORTH
const REGION_NORTH: MapRegion[] = [
  { id: 'JK', name: 'Jammu & Kashmir', color: '#60A5FA', path: 'M320 20 L500 40 L530 140 L350 160 L280 100 Z' },
  { id: 'HP', name: 'Himachal', color: '#3B82F6', path: 'M450 150 L530 140 L540 220 L460 210 Z' },
  { id: 'PB', name: 'Punjab', color: '#93C5FD', path: 'M300 160 L450 150 L420 230 L320 220 Z' },
  { id: 'HR', name: 'Haryana', color: '#2563EB', path: 'M380 230 L460 210 L480 290 L390 290 Z' },
  { id: 'UP', name: 'Uttar Pradesh', color: '#1D4ED8', path: 'M460 210 L680 230 L700 350 L500 350 L480 290 Z' },
  { id: 'UK', name: 'Uttarakhand', color: '#DBEAFE', path: 'M530 140 L650 150 L680 230 L540 220 Z' }
];

// 2. WEST
const REGION_WEST: MapRegion[] = [
  { id: 'RJ', name: 'Rajasthan', color: '#FCD34D', path: 'M200 230 L380 230 L390 290 L350 400 L150 350 Z' },
  { id: 'GJ', name: 'Gujarat', color: '#F59E0B', path: 'M80 350 L250 350 L300 450 L250 520 L100 450 Z' },
  { id: 'MH', name: 'Maharashtra', color: '#D97706', path: 'M250 500 L500 480 L550 650 L250 650 Z' },
  { id: 'GA', name: 'Goa', color: '#78350F', path: 'M250 650 L290 650 L290 680 L250 680 Z' } // Small piece
];

// 3. CENTRAL (Shared often, putting in West level for balance or Total)
const REGION_CENTRAL: MapRegion[] = [
  { id: 'MP', name: 'Madhya Pradesh', color: '#F97316', path: 'M350 380 L650 350 L680 500 L400 500 Z' },
  { id: 'CG', name: 'Chhattisgarh', color: '#EA580C', path: 'M550 480 L680 480 L650 650 L550 600 Z' }
];

// 4. EAST
const REGION_EAST: MapRegion[] = [
  { id: 'BR', name: 'Bihar', color: '#F472B6', path: 'M600 280 L780 280 L780 360 L650 360 Z' },
  { id: 'JH', name: 'Jharkhand', color: '#EC4899', path: 'M620 360 L750 360 L720 480 L600 450 Z' },
  { id: 'WB', name: 'West Bengal', color: '#DB2777', path: 'M750 250 L820 250 L800 500 L720 480 L750 360 Z' },
  { id: 'OD', name: 'Odisha', color: '#BE185D', path: 'M620 500 L780 500 L720 650 L580 620 Z' },
  { id: 'AR', name: 'Arunachal', color: '#FBCFE8', path: 'M820 180 L980 200 L950 280 L820 250 Z' },
  { id: 'AS', name: 'Assam', color: '#831843', path: 'M820 250 L950 280 L900 350 L800 350 Z' }
];

// 5. SOUTH
const REGION_SOUTH: MapRegion[] = [
  { id: 'TG', name: 'Telangana', color: '#34D399', path: 'M400 600 L580 620 L550 720 L450 720 Z' },
  { id: 'AP', name: 'Andhra Pradesh', color: '#10B981', path: 'M580 620 L720 650 L600 850 L550 720 Z' },
  { id: 'KA', name: 'Karnataka', color: '#059669', path: 'M250 650 L450 600 L450 820 L300 820 Z' },
  { id: 'TN', name: 'Tamil Nadu', color: '#047857', path: 'M400 820 L600 850 L550 980 L400 950 Z' },
  { id: 'KL', name: 'Kerala', color: '#064E3B', path: 'M300 820 L400 820 L400 950 L330 920 Z' }
];

// Combine for Total Map
const TOTAL_INDIA = [
  ...REGION_NORTH,
  ...REGION_WEST,
  ...REGION_CENTRAL,
  ...REGION_EAST,
  ...REGION_SOUTH
];

// --- PUZZLE CONFIGURATION ---

const PUZZLES: MapPuzzle[] = [
  {
    id: 1,
    name: 'North India',
    difficulty: 'easy',
    regions: REGION_NORTH,
    timeLimit: 120,
    xpReward: 100,
    themeColor: 'blue'
  },
  {
    id: 2,
    name: 'West & Central India',
    difficulty: 'medium',
    regions: [...REGION_WEST, ...REGION_CENTRAL],
    timeLimit: 180,
    xpReward: 150,
    themeColor: 'orange'
  },
  {
    id: 3,
    name: 'East India',
    difficulty: 'medium',
    regions: REGION_EAST,
    timeLimit: 180,
    xpReward: 150,
    themeColor: 'pink'
  },
  {
    id: 4,
    name: 'South India',
    difficulty: 'medium',
    regions: REGION_SOUTH,
    timeLimit: 180,
    xpReward: 150,
    themeColor: 'emerald'
  },
  {
    id: 5,
    name: 'TOTAL INDIA CHALLENGE',
    difficulty: 'expert',
    regions: TOTAL_INDIA,
    timeLimit: 600, // 10 minutes
    xpReward: 500,
    themeColor: 'indigo'
  }
];

// --- COMPONENT ---

export function PuzzleBuilder() {
  const navigate = useNavigate();
  
  // Game State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'won'>('menu');
  const [currentPuzzle, setCurrentPuzzle] = useState<MapPuzzle | null>(null);
  const [placedPieces, setPlacedPieces] = useState<string[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<MapRegion | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  
  // Ref for the SVG Board - This allows us to calculate coordinates if needed later
  const svgRef = useRef<SVGSVGElement>(null);

  // Stats
  const [stats, setStats] = useState<PuzzleStats>(() => {
    try {
      const raw = localStorage.getItem('mapPuzzleStats');
      return raw ? JSON.parse(raw) : { gamesPlayed: 0, puzzlesSolved: 0, totalXP: 0 };
    } catch {
      return { gamesPlayed: 0, puzzlesSolved: 0, totalXP: 0 };
    }
  });

  // --- EVENT LISTENERS ---

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => {
      if (prev <= 1) {
        setGameState('menu'); 
        return 0;
      }
      return prev - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // --- GAME LOGIC ---

  const startGame = (puzzle: MapPuzzle) => {
    setCurrentPuzzle(puzzle);
    setPlacedPieces([]);
    setTimeLeft(puzzle.timeLimit);
    setGameState('playing');
  };

  const handleDragStart = (region: MapRegion) => {
    setDraggedPiece(region);
  };

  const handleDrop = (e: React.MouseEvent) => {
    if (!draggedPiece || !currentPuzzle) return;

    // Hit Detection using element attribute
    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
    const targetId = elementUnderCursor?.getAttribute('data-region-id');

    if (targetId === draggedPiece.id) {
      setPlacedPieces(prev => {
        const newPlaced = [...prev, draggedPiece.id];
        if (newPlaced.length === currentPuzzle.regions.length) {
          handleWin();
        }
        return newPlaced;
      });
    }
    setDraggedPiece(null);
  };

  const handleWin = () => {
    if (!currentPuzzle) return;
    const earned = currentPuzzle.xpReward;
    setXpEarned(earned);
    
    const newStats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      puzzlesSolved: stats.puzzlesSolved + 1,
      totalXP: stats.totalXP + earned
    };
    setStats(newStats);
    localStorage.setItem('mapPuzzleStats', JSON.stringify(newStats));
    
    // Map 'expert' to 'hard' for the API type compatibility
    const apiDifficulty = currentPuzzle.difficulty === 'expert' ? 'hard' : currentPuzzle.difficulty;

    submitSpeedType({ 
      difficulty: apiDifficulty, 
      wpm: 100, 
      accuracy: 100, 
      wordsCorrect: 1, 
      totalWords: 1 
    }).catch(console.error);

    setTimeout(() => setGameState('won'), 500);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // --- RENDERERS ---

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-6xl">
          <Card className="bg-white border-slate-200 shadow-sm mb-8">
            <CardHeader className="text-center pb-6 border-b border-slate-100">
              <CardTitle className="text-5xl font-black text-slate-800 flex items-center justify-center gap-4">
                <MapIcon className="w-12 h-12 text-blue-500" />
                Indian Cartographer
              </CardTitle>
              <p className="text-slate-500 mt-4 text-lg">Rebuild the map of India, region by region.</p>
              
              <div className="flex justify-center gap-8 mt-6 text-sm font-bold text-slate-400">
                <div className="flex flex-col items-center">
                  <span className="text-2xl text-blue-500">{stats.puzzlesSolved}</span>
                  <span>SOLVED</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl text-yellow-500">{stats.totalXP}</span>
                  <span>XP EARNED</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PUZZLES.map(puzzle => (
              <button
                key={puzzle.id}
                onClick={() => startGame(puzzle)}
                className={`group relative overflow-hidden p-6 rounded-2xl bg-white border-2 hover:border-transparent transition-all text-left shadow-sm hover:shadow-xl hover:-translate-y-1
                  ${puzzle.difficulty === 'expert' ? 'md:col-span-2 lg:col-span-1 ring-2 ring-indigo-100' : 'border-slate-100'}
                `}
              >
                {/* Background Color Splash on Hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-${puzzle.themeColor}-500`} />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${puzzle.difficulty === 'easy' ? 'bg-green-100 text-green-700' : 
                        puzzle.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                        puzzle.difficulty === 'expert' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-red-100 text-red-700'}
                    `}>
                      {puzzle.difficulty}
                    </span>
                    {puzzle.difficulty === 'expert' && <Trophy className="w-5 h-5 text-indigo-500 animate-pulse" />}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600">{puzzle.name}</h3>
                  <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                    <span>⏱️ {formatTime(puzzle.timeLimit)}</span>
                    <span>⭐ {puzzle.xpReward} XP</span>
                    <span>🧩 {puzzle.regions.length} States</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button onClick={() => navigate('/games')} variant="ghost" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing' && currentPuzzle) {
    const unplacedRegions = currentPuzzle.regions.filter(r => !placedPieces.includes(r.id));

    return (
      <div 
        className="min-h-screen bg-slate-50 flex flex-col overflow-hidden select-none"
        onMouseUp={() => setDraggedPiece(null)}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => setGameState('menu')} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{currentPuzzle.name}</h2>
              <p className="text-sm text-slate-500">Drag states to the map</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Button size="sm" variant="outline" onClick={() => startGame(currentPuzzle)} className="hidden sm:flex text-slate-500 border-slate-200 hover:bg-slate-50">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Time Left</div>
              <div className={`text-2xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Progress</div>
              <div className="text-2xl font-bold text-blue-600">
                {placedPieces.length} / {currentPuzzle.regions.length}
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT: The Tray */}
          <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                <GripVertical className="w-4 h-4" /> Unplaced Pieces
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {unplacedRegions.map(region => (
                <div
                  key={region.id}
                  onMouseDown={() => handleDragStart(region)}
                  className="group cursor-grab active:cursor-grabbing bg-white p-3 rounded-xl border-2 border-slate-100 hover:border-blue-400 transition-all flex items-center gap-4 hover:shadow-md"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center p-1 border border-slate-100 overflow-hidden relative">
                    {/* Miniature Preview - Simplified view for context */}
                    <svg viewBox="0 0 1000 1000" className="w-full h-full">
                      <path d={region.path} fill={region.color} />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{region.name}</div>
                  </div>
                </div>
              ))}
              {unplacedRegions.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-emerald-500 animate-in fade-in duration-500">
                  <CheckCircle2 className="w-16 h-16 mb-4" />
                  <p className="font-bold text-lg">All pieces placed!</p>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT: The Map Board */}
          <main className="flex-1 bg-slate-50 relative overflow-hidden flex items-center justify-center p-8">
            <div className="relative w-full h-full max-w-[800px] max-h-[800px] aspect-square bg-white rounded-full shadow-lg border-4 border-white">
              <svg
                ref={svgRef}
                viewBox="0 0 1000 1000"
                className="w-full h-full"
                onMouseUp={handleDrop}
              >
                {/* 1. Empty Slots (Ghost Outlines) */}
                {currentPuzzle.regions.map(r => (
                  <path
                    key={`target-${r.id}`}
                    d={r.path}
                    fill={placedPieces.includes(r.id) ? r.color : '#F1F5F9'} // Colored if placed, light gray if empty
                    stroke={placedPieces.includes(r.id) ? 'white' : '#CBD5E1'}
                    strokeWidth="2"
                    strokeDasharray={placedPieces.includes(r.id) ? '0' : '4 2'}
                    className="transition-colors duration-300"
                    data-region-id={r.id} // Drop Target
                  />
                ))}

                {/* 2. Placed Pieces (Overlay) */}
                {placedPieces.map(id => {
                  const r = currentPuzzle.regions.find(reg => reg.id === id);
                  if (!r) return null;
                  return (
                    <g key={`placed-${id}`} className="animate-in zoom-in fade-in duration-300 pointer-events-none">
                      <path d={r.path} fill={r.color} stroke="white" strokeWidth="2" />
                    </g>
                  );
                })}
              </svg>
            </div>
          </main>
        </div>

        {/* DRAGGING GHOST */}
        {draggedPiece && (
          <div 
            className="fixed pointer-events-none z-50 opacity-90"
            style={{ 
              left: mousePos.x, 
              top: mousePos.y,
              transform: 'translate(-50%, -50%) scale(1.1)',
            }}
          >
            <div className="relative filter drop-shadow-xl">
              <svg width="300" height="300" viewBox="0 0 1000 1000" className="overflow-visible">
                 <path d={draggedPiece.path} fill={draggedPiece.color} stroke="white" strokeWidth="4" />
              </svg>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-slate-800 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                {draggedPiece.name}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Win Screen
  if (gameState === 'won') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white border-emerald-100 shadow-xl relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />
          
          <CardContent className="pt-12 pb-10 relative z-10">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50 animate-bounce">
              <Trophy className="w-12 h-12 text-emerald-600" />
            </div>
            
            <h2 className="text-4xl font-black text-slate-800 mb-2">Map Complete!</h2>
            <p className="text-slate-500 mb-8 text-lg">You have mastered <span className="font-bold text-emerald-600">{currentPuzzle?.name}</span>.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Time</div>
                <div className="text-3xl font-bold text-slate-700 font-mono">
                  {currentPuzzle && formatTime(currentPuzzle.timeLimit - timeLeft)}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">XP Earned</div>
                <div className="text-3xl font-bold text-yellow-500">+{xpEarned}</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => setGameState('menu')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg rounded-xl shadow-lg shadow-blue-200">
                Next Map
              </Button>
              <Button onClick={() => navigate('/games')} variant="outline" className="flex-1 border-slate-200 text-slate-500 hover:bg-slate-50 h-14 text-lg rounded-xl">
                Exit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}