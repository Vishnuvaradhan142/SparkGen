import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Play, Trophy, Code, Lightbulb, PenTool, Eraser } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';

// --- Types ---

interface TurtleStats {
  gamesPlayed: number;
  levelsSolved: number;
  totalXP: number;
}

interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  targetShape: string;
  hint: string;
  xpReward: number;
  requiredShape?: 'closed' | 'open';
  expectedLines: number; // Exact lines needed
  solutionCode: string; 
}

// --- DATA ---

const LEVELS: Level[] = [
  {
    id: 1,
    name: 'The Square',
    description: 'Draw a square using a loop.',
    difficulty: 'easy',
    targetShape: 'Square',
    hint: 'repeat 4 [ fd 100 rt 90 ]',
    xpReward: 50,
    requiredShape: 'closed',
    expectedLines: 4,
    solutionCode: 'repeat 4 [ fd 100 rt 90 ]'
  },
  {
    id: 2,
    name: 'The Triangle',
    description: 'Draw an equilateral triangle.',
    difficulty: 'easy',
    targetShape: 'Triangle',
    hint: 'repeat 3 [ fd 100 rt 120 ]',
    xpReward: 50,
    requiredShape: 'closed',
    expectedLines: 3,
    solutionCode: 'repeat 3 [ fd 100 rt 120 ]'
  },
  {
    id: 3,
    name: 'Dashed Line',
    description: 'Use Pen Up (pu) and Pen Down (pd).',
    difficulty: 'medium',
    targetShape: 'Dashed Line',
    hint: 'repeat 3 [ pd fd 40 pu fd 40 ]',
    xpReward: 75,
    requiredShape: 'open',
    expectedLines: 3,
    solutionCode: 'repeat 3 [ pd fd 40 pu fd 40 ]'
  },
  {
    id: 4,
    name: 'Parallel Lines',
    description: 'Draw two lines next to each other.',
    difficulty: 'medium',
    targetShape: 'Parallel Lines',
    hint: 'fd 100 pu rt 90 fd 50 rt 90 pd fd 100',
    xpReward: 100,
    requiredShape: 'open',
    expectedLines: 2,
    solutionCode: 'fd 100 pu rt 90 fd 50 rt 90 pd fd 100'
  },
  {
    id: 5,
    name: 'The Pentagon',
    description: 'Draw a 5-sided shape.',
    difficulty: 'medium',
    targetShape: 'Pentagon',
    hint: 'repeat 5 [ fd 80 rt 72 ]',
    xpReward: 100,
    requiredShape: 'closed',
    expectedLines: 5,
    solutionCode: 'repeat 5 [ fd 80 rt 72 ]'
  },
  {
    id: 6,
    name: 'The House',
    description: 'Square with a triangle roof.',
    difficulty: 'hard',
    targetShape: 'House',
    hint: 'Draw square, then triangle on top.',
    xpReward: 150,
    requiredShape: 'closed',
    expectedLines: 6,
    solutionCode: 'repeat 4 [ fd 80 rt 90 ] fd 80 rt 30 fd 80 rt 120 fd 80' 
  },
  {
    id: 7,
    name: 'Hexagon Hive',
    description: 'Draw a 6-sided hexagon.',
    difficulty: 'medium',
    targetShape: 'Hexagon',
    hint: 'repeat 6 [ fd 60 rt 60 ]',
    xpReward: 120,
    requiredShape: 'closed',
    expectedLines: 6,
    solutionCode: 'repeat 6 [ fd 60 rt 60 ]'
  },
  {
    id: 8,
    name: 'Star Power',
    description: 'Draw a 5-pointed star.',
    difficulty: 'hard',
    targetShape: 'Star',
    hint: 'repeat 5 [ fd 100 rt 144 ]',
    xpReward: 150,
    requiredShape: 'closed',
    expectedLines: 5,
    solutionCode: 'repeat 5 [ fd 100 rt 144 ]'
  },
  {
    id: 9,
    name: 'Windmill',
    description: '4 squares rotating around center.',
    difficulty: 'expert',
    targetShape: 'Windmill',
    hint: 'repeat 4 [ repeat 4 [ fd 50 rt 90 ] rt 90 ]',
    xpReward: 200,
    requiredShape: 'closed',
    expectedLines: 16,
    solutionCode: 'repeat 4 [ repeat 4 [ fd 50 rt 90 ] rt 90 ]'
  },
  {
    id: 10,
    name: 'Spiral Galaxy',
    description: 'A spiral that gets bigger.',
    difficulty: 'expert',
    targetShape: 'Spiral',
    hint: 'Manually increase forward distance.',
    xpReward: 250,
    requiredShape: 'open',
    expectedLines: 12,
    solutionCode: 'fd 10 rt 90 fd 20 rt 90 fd 30 rt 90 fd 40 rt 90 fd 50 rt 90 fd 60 rt 90 fd 70 rt 90' 
  },
];

// --- PARSER HELPER ---
const preprocessCode = (code: string): string[] => {
  let cleanCode = code.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  for(let i=0; i<3; i++) { // Increase recursion depth for nested loops
    cleanCode = cleanCode.replace(/repeat\s+(\d+)\s*\[([^\]]+)\]/gi, (_, count, content) => {
      return Array(parseInt(count)).fill(content).join(' ');
    });
  }
  return cleanCode.split(' ').filter(c => c);
};

// --- COMPONENT ---

export function TurtleGraphics() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  
  const [currentLevelId, setCurrentLevelId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'won'>('menu');
  const [commandInput, setCommandInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  
  const [xpEarned, setXpEarned] = useState(0);
  const [stats, setStats] = useState<TurtleStats>(() => {
    try {
      const raw = localStorage.getItem('turtleStats');
      return raw ? JSON.parse(raw) : { gamesPlayed: 0, levelsSolved: 0, totalXP: 0 };
    } catch {
      return { gamesPlayed: 0, levelsSolved: 0, totalXP: 0 };
    }
  });

  const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  // Auto-scroll console
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [consoleLog]);

  // Initialize Canvases
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setTimeout(() => {
        resetCanvas(canvasRef.current, true);
        drawPreview(); 
      }, 100); // Increased timeout slightly to ensure rendering
      return () => clearTimeout(timer);
    }
  }, [gameState, currentLevelId]);

  // --- DRAWING HELPERS ---

  const resetCanvas = (canvas: HTMLCanvasElement | null, drawInitialTurtle = false) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#f8fafc'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid (Only for main canvas)
    if (canvas.width > 200) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= canvas.width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
      for (let i = 0; i <= canvas.height; i += 40) { ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); }
      ctx.stroke();
    }

    if (drawInitialTurtle) {
      setConsoleLog(['Ready! Type commands...']);
      drawTurtleSprite(ctx, canvas.width / 2, canvas.height / 2, 0);
    }
  };

  const drawTurtleSprite = (ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, color: string = '#10b981') => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angleDeg * Math.PI) / 180);
    // Body
    ctx.fillStyle = color; 
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    // Head
    ctx.fillStyle = '#065f46'; 
    ctx.beginPath(); ctx.arc(0, -10, 6, 0, Math.PI * 2); ctx.fill();
    // Legs
    ctx.fillRect(-11, -6, 5, 12);
    ctx.fillRect(7, -6, 5, 12);
    ctx.restore();
  };

  // --- PREVIEW RENDERER ---
  const drawPreview = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset preview canvas properly
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear transparently first
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const commands = preprocessCode(currentLevel.solutionCode);
    
    // Preview State
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    let angle = -90;
    let isPenDown = true;

    // Scale down movement for preview box
    const scale = 0.4; 

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6'; // Blue
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);

    commands.forEach((token, i) => {
      const nextToken = commands[i+1];
      const value = parseInt(nextToken) || 0;
      
      if (token === 'fd' || token === 'forward') {
        const rad = (angle * Math.PI) / 180;
        const dist = value * scale;
        const newX = x + Math.cos(rad) * dist;
        const newY = y + Math.sin(rad) * dist;
        
        if (isPenDown) {
          ctx.lineTo(newX, newY);
          ctx.stroke();
          ctx.beginPath(); // Reset path to avoid connecting jump lines
          ctx.moveTo(newX, newY);
        } else {
          ctx.moveTo(newX, newY);
        }
        x = newX; y = newY;
      } 
      else if (token === 'bk' || token === 'back') {
        const rad = (angle * Math.PI) / 180;
        const dist = value * scale;
        const newX = x - Math.cos(rad) * dist;
        const newY = y - Math.sin(rad) * dist;
        
        if (isPenDown) {
          ctx.lineTo(newX, newY);
          ctx.stroke();
          ctx.beginPath(); 
          ctx.moveTo(newX, newY);
        } else {
          ctx.moveTo(newX, newY);
        }
        x = newX; y = newY;
      }
      else if (token === 'rt' || token === 'right') angle += value;
      else if (token === 'lt' || token === 'left') angle -= value;
      else if (['pu', 'penup'].includes(token)) isPenDown = false;
      else if (['pd', 'pendown'].includes(token)) isPenDown = true;
    });
  };

  // --- MAIN RUNNER (Animated) ---
  const runCode = async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setConsoleLog(['Parsing...']);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resetCanvas(canvas, false); // Clear board

    let x = canvas.width / 2;
    let y = canvas.height / 2;
    const startX = x;
    const startY = y;
    let canvasAngle = -90; 
    let isPenDown = true;
    let penColor = '#2563eb'; 
    let linesDrawn = 0;

    const tokens = preprocessCode(commandInput);
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].toLowerCase();
      const nextToken = tokens[i + 1];
      const value = parseInt(nextToken) || 0;
      let consumedArg = false;

      if (['fd', 'forward', 'bk', 'back', 'rt', 'right', 'lt', 'left'].includes(token)) {
         await new Promise(r => setTimeout(r, 150)); // Slightly faster
      }

      if (token === 'fd' || token === 'forward') {
        const rad = (canvasAngle * Math.PI) / 180;
        const newX = x + Math.cos(rad) * value;
        const newY = y + Math.sin(rad) * value;
        
        if (isPenDown) {
          ctx.strokeStyle = penColor;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(newX, newY);
          ctx.stroke();
          linesDrawn++;
        }
        x = newX; y = newY;
        consumedArg = true;
        setConsoleLog(prev => [...prev, `> fd ${value}`]);
      } 
      else if (token === 'bk' || token === 'back') {
        const rad = (canvasAngle * Math.PI) / 180;
        const newX = x - Math.cos(rad) * value;
        const newY = y - Math.sin(rad) * value;
        
        if (isPenDown) {
          ctx.strokeStyle = penColor;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(newX, newY);
          ctx.stroke();
          linesDrawn++;
        }
        x = newX; y = newY;
        consumedArg = true;
        setConsoleLog(prev => [...prev, `> bk ${value}`]);
      }
      else if (token === 'rt' || token === 'right') {
        canvasAngle += value;
        consumedArg = true;
        setConsoleLog(prev => [...prev, `> rt ${value}`]);
      } 
      else if (token === 'lt' || token === 'left') {
        canvasAngle -= value;
        consumedArg = true;
        setConsoleLog(prev => [...prev, `> lt ${value}`]);
      }
      else if (['pu', 'penup'].includes(token)) {
        isPenDown = false;
        setConsoleLog(prev => [...prev, `> pen up`]);
      }
      else if (['pd', 'pendown'].includes(token)) {
        isPenDown = true;
        setConsoleLog(prev => [...prev, `> pen down`]);
      }
      else if (token === 'color') {
        penColor = nextToken; 
        consumedArg = true;
        setConsoleLog(prev => [...prev, `> color ${penColor}`]);
      }
      else if (!isNaN(Number(token))) {
        continue; 
      }

      if (consumedArg) i++;
      drawTurtleSprite(ctx, x, y, canvasAngle + 90, penColor); 
    }

    setIsDrawing(false);
    
    const distanceToStart = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
    checkWinCondition(distanceToStart, linesDrawn);
  };

  const checkWinCondition = (dist: number, lines: number) => {
    let isWin = false;
    let feedback = "";

    const isClosed = dist < 5; 
    
    // Strict Validation:
    // If Triangle, MUST draw exactly 3 lines.
    // If Square, MUST draw exactly 4 lines.
    
    if (currentLevel.requiredShape === 'closed') {
      if (!isClosed) {
        feedback = "Shape is open! Turtle must return to start.";
      } else if (lines !== currentLevel.expectedLines) {
        feedback = `Incorrect shape! You drew ${lines} lines, but a ${currentLevel.targetShape} needs ${currentLevel.expectedLines}.`;
      } else {
        isWin = true;
      }
    } else {
      // For open shapes, check minimum effort
      if (lines >= currentLevel.expectedLines) isWin = true;
      else feedback = "Not enough drawing!";
    }

    if (isWin) {
      setConsoleLog(prev => [...prev, "✨ SUCCESS! Pattern Verified."]);
      setTimeout(() => {
        setXpEarned(currentLevel.xpReward);
        const newStats = {
          ...stats,
          gamesPlayed: stats.gamesPlayed + 1,
          levelsSolved: stats.levelsSolved + 1,
          totalXP: stats.totalXP + currentLevel.xpReward
        };
        setStats(newStats);
        localStorage.setItem('turtleStats', JSON.stringify(newStats));
        setGameState('won');
      }, 800);
    } else {
      setConsoleLog(prev => [...prev, `❌ ${feedback}`]);
    }
  };

  // --- RENDERERS ---

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-indigo-50 p-6 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-6xl">
          <Card className="mb-8 border-indigo-100 shadow-sm bg-white">
            <CardHeader className="text-center pb-6 border-b border-gray-100">
              <CardTitle className="text-5xl font-black text-indigo-600 flex items-center justify-center gap-4">
                🐢 Turtle Code
              </CardTitle>
              <p className="text-gray-500 mt-4 text-lg">Use code to control the turtle and draw art!</p>
              
              <div className="flex justify-center gap-8 mt-6 text-sm font-bold text-gray-400">
                <div className="flex flex-col items-center">
                  <span className="text-2xl text-indigo-500">{stats.levelsSolved}</span>
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
            {LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => {
                  setCurrentLevelId(level.id);
                  setGameState('playing');
                  setCommandInput('');
                  setShowHint(false);
                }}
                className={`group relative overflow-hidden p-6 rounded-2xl bg-white border-2 hover:border-indigo-400 transition-all text-left shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                  level.difficulty === 'hard' || level.difficulty === 'expert' ? 'border-orange-100' : 'border-indigo-50'
                }`}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      level.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      level.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {level.difficulty}
                    </span>
                    <Code className="w-5 h-5 text-gray-300 group-hover:text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{level.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{level.description}</p>
                  <div className="flex items-center gap-4 text-sm font-bold text-indigo-600">
                    <span>⭐ {level.xpReward} XP</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button onClick={() => navigate('/games')} variant="ghost" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => setGameState('menu')}>
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm">Lvl {currentLevel.id}</span>
                {currentLevel.name}
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Goal: {currentLevel.targetShape}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={() => resetCanvas(canvasRef.current, true)} className="text-slate-500 border-slate-200 hover:bg-slate-100">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <Button variant="outline" onClick={() => setShowHint(!showHint)} className="text-yellow-600 border-yellow-200 hover:bg-yellow-50">
              <Lightbulb className="w-4 h-4 mr-2" /> {showHint ? 'Hide Hint' : 'Hint'}
            </Button>
            <Button onClick={runCode} disabled={isDrawing} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 min-w-[120px]">
              <Play className="w-4 h-4 mr-2" /> {isDrawing ? 'Running...' : 'Run'}
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT: Code Editor */}
          <div className="w-1/3 min-w-[350px] bg-slate-900 flex flex-col border-r border-slate-700">
            <div className="bg-slate-800 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center">
              <span>TURTLE.SCRIPT</span>
              <span className="text-indigo-400">● Interactive</span>
            </div>
            
            <div className="flex-1 relative group">
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-900 border-r border-slate-800 pt-4 text-right pr-3 text-slate-600 font-mono text-sm select-none">
                {commandInput.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <textarea
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                spellCheck={false}
                className="w-full h-full bg-[#0f172a] text-emerald-300 font-mono text-sm p-4 pl-12 resize-none focus:outline-none leading-relaxed"
                placeholder={`// Try this:\nrepeat 4 [\n  forward 100\n  right 90\n]`}
              />
            </div>

            {/* Quick Commands */}
            <div className="bg-slate-800 p-2 grid grid-cols-4 gap-2 border-t border-slate-700">
               {['repeat 4 [ ]', 'forward 100', 'right 90', 'penup', 'color red'].map(cmd => (
                 <button 
                   key={cmd}
                   onClick={() => setCommandInput(prev => prev + (prev ? '\n' : '') + cmd)}
                   className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-1 rounded transition-colors font-mono truncate"
                   title={cmd}
                 >
                   {cmd.split(' ')[0]}
                 </button>
               ))}
            </div>

            {/* Console */}
            <div className="h-48 bg-black border-t border-slate-700 flex flex-col">
              <div className="px-4 py-1 bg-slate-800 text-xs text-slate-400 font-bold tracking-wider flex justify-between">
                <span>TERMINAL</span>
                <span className="cursor-pointer hover:text-white" onClick={() => setConsoleLog([])}>Clear</span>
              </div>
              <div 
                ref={consoleEndRef}
                className="flex-1 overflow-y-auto p-3 font-mono text-xs text-slate-300 space-y-1 scroll-smooth"
              >
                {consoleLog.map((log, i) => (
                  <div key={i} className={log.includes('❌') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-green-400 font-bold' : 'text-slate-300'}>{log}</div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Canvas */}
          <div className="flex-1 bg-slate-100 relative flex flex-col items-center justify-center p-8 overflow-hidden">
            
            <div className="relative shadow-2xl rounded-lg overflow-hidden border-4 border-white bg-white">
              <canvas ref={canvasRef} width={600} height={500} className="bg-white" />
              
              {/* GOAL PREVIEW BOX */}
              <div className="absolute top-4 left-4 bg-white/90 border border-slate-200 p-3 rounded-xl shadow-lg backdrop-blur-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Goal</p>
                <div className="border border-slate-100 rounded-lg overflow-hidden bg-white">
                  <canvas ref={previewCanvasRef} width={120} height={100} className="block" />
                </div>
              </div>

              {/* Overlay Hint */}
              {showHint && (
                <div className="absolute top-4 right-4 bg-yellow-50 border border-yellow-200 text-yellow-900 p-4 rounded-xl shadow-lg max-w-xs text-sm animate-in fade-in slide-in-from-top-2 z-10">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600 shrink-0" />
                    <div>
                      <p className="font-bold mb-1">Level Hint:</p>
                      <p className="text-yellow-800 leading-relaxed font-mono text-xs">{currentLevel.hint}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-4 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1"><PenTool className="w-3 h-3"/> Pen: {isDrawing ? 'Busy' : 'Ready'}</span>
              <span className="flex items-center gap-1"><Eraser className="w-3 h-3"/> Canvas: 600x500</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Win Screen
  if (gameState === 'won') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-emerald-100 shadow-xl relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />
          
          <CardContent className="pt-12 pb-10 relative z-10">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50 animate-bounce">
              <Trophy className="w-12 h-12 text-emerald-600" />
            </div>
            
            <h2 className="text-4xl font-black text-slate-800 mb-2">Success!</h2>
            <p className="text-slate-500 mb-8 text-lg">You programmed a <span className="font-bold text-emerald-600">{currentLevel.targetShape}</span>.</p>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">XP Earned</div>
              <div className="text-3xl font-bold text-yellow-500">+{xpEarned}</div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => setGameState('menu')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-lg rounded-xl shadow-lg shadow-emerald-200">
                Next Level
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