import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RotateCcw, Trophy, Settings, X, Lightbulb, Home, Plus, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';

// --- TYPES ---

type ItemType = 'Fruit' | 'Veggie' | 'Toy' | 'Animal';
type ItemColor = 'Red' | 'Green' | 'Yellow';

interface FactoryStats {
  gamesPlayed: number;
  levelsSolved: number;
  totalXP: number;
}

interface Item {
  id: number;
  icon: string;
  type: ItemType;
  color: ItemColor;
  name: string;
}

interface Rule {
  id: number;
  property: 'Type' | 'Color' | 'Name';
  operator: 'Is';
  value: string;
  
  action: 'Bin' | 'Check'; // Bin = Send to destination, Check = Nested rules
  destination?: string;    // For 'Bin' action
  nestedRules?: Rule[];    // For 'Check' action
  nestedElse?: string;     // Default bin for the nested block if no rules match
}

interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master' | 'Hacker';
  queue: Item[];
  bins: { id: string; label: string; color: string; accepts: (item: Item) => boolean }[];
  hint: string;
  xpReward: number;
}

// --- DATA ---

const ITEMS: Record<string, Item> = {
  apple: { id: 1, icon: '🍎', type: 'Fruit', color: 'Red', name: 'Apple' },
  banana: { id: 2, icon: '🍌', type: 'Fruit', color: 'Yellow', name: 'Banana' },
  broccoli: { id: 3, icon: '🥦', type: 'Veggie', color: 'Green', name: 'Broccoli' },
  carrot: { id: 4, icon: '🥕', type: 'Veggie', color: 'Red', name: 'Carrot' },
  ball: { id: 5, icon: '⚽', type: 'Toy', color: 'Yellow' as any, name: 'Ball' },
  bear: { id: 6, icon: '🧸', type: 'Toy', color: 'Red' as any, name: 'Bear' },
  pepper: { id: 7, icon: '🌶️', type: 'Veggie', color: 'Red', name: 'Pepper' },
  lemon: { id: 8, icon: '🍋', type: 'Fruit', color: 'Yellow', name: 'Lemon' },
  frog: { id: 9, icon: '🐸', type: 'Animal', color: 'Green', name: 'Frog' },
  chick: { id: 10, icon: '🐥', type: 'Animal', color: 'Yellow', name: 'Chick' },
  crab: { id: 11, icon: '🦀', type: 'Animal', color: 'Red', name: 'Crab' },
};

const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Fruit Sorter',
    description: 'Send all Fruits to Bin A. Send everything else to Bin B.',
    difficulty: 'Easy',
    queue: [ITEMS.apple, ITEMS.broccoli, ITEMS.banana, ITEMS.pepper, ITEMS.lemon],
    bins: [
      { id: 'Bin A', label: 'Fruits', color: 'blue', accepts: (i) => i.type === 'Fruit' },
      { id: 'Bin B', label: 'Others', color: 'slate', accepts: (i) => i.type !== 'Fruit' },
    ],
    hint: 'IF Type IS Fruit -> Bin A',
    xpReward: 100,
  },
  {
    id: 3,
    name: 'Specific Sorting',
    description: 'We need Bananas in Bin A. Everything else in Bin B.',
    difficulty: 'Medium',
    queue: [ITEMS.apple, ITEMS.banana, ITEMS.banana, ITEMS.lemon, ITEMS.apple],
    bins: [
      { id: 'Bin A', label: 'Bananas', color: 'yellow', accepts: (i) => i.name === 'Banana' },
      { id: 'Bin B', label: 'Compost', color: 'slate', accepts: (i) => i.name !== 'Banana' },
    ],
    hint: 'IF Name IS Banana -> Bin A',
    xpReward: 150,
  },
  {
    id: 6,
    name: 'Excluded!',
    description: 'We want everything EXCEPT Red items in Bin A.',
    difficulty: 'Hard',
    queue: [ITEMS.banana, ITEMS.apple, ITEMS.frog, ITEMS.crab, ITEMS.lemon],
    bins: [
      { id: 'Bin A', label: 'Not Red', color: 'blue', accepts: (i) => i.color !== 'Red' },
      { id: 'Bin B', label: 'Red Trash', color: 'red', accepts: (i) => i.color === 'Red' },
    ],
    hint: 'Try this: IF Color IS Red -> Bin B. (Implicitly everything else goes to Bin A via the ELSE!)',
    xpReward: 300,
  },
  {
    id: 9,
    name: 'Tri-Color Sort',
    description: 'Sort items by color into three different bins.',
    difficulty: 'Expert',
    queue: [ITEMS.apple, ITEMS.banana, ITEMS.frog, ITEMS.carrot, ITEMS.lemon],
    bins: [
      { id: 'Bin A', label: 'Red', color: 'red', accepts: (i) => i.color === 'Red' },
      { id: 'Bin B', label: 'Green', color: 'green', accepts: (i) => i.color === 'Green' },
      { id: 'Bin C', label: 'Yellow', color: 'yellow', accepts: (i) => i.color === 'Yellow' },
    ],
    hint: 'Create a rule for each color. The last color can be caught by ELSE!',
    xpReward: 450,
  },
  {
    id: 10,
    name: 'Zoo Logic',
    description: 'Animals to A, Fruits to B, everything else to C.',
    difficulty: 'Expert',
    queue: [ITEMS.frog, ITEMS.apple, ITEMS.bear, ITEMS.lemon, ITEMS.chick],
    bins: [
      { id: 'Bin A', label: 'Animals', color: 'orange', accepts: (i) => i.type === 'Animal' },
      { id: 'Bin B', label: 'Fruits', color: 'purple', accepts: (i) => i.type === 'Fruit' },
      { id: 'Bin C', label: 'Others', color: 'slate', accepts: (i) => i.type !== 'Animal' && i.type !== 'Fruit' },
    ],
    hint: 'IF Type IS Animal -> A. ELSE IF Type IS Fruit -> B. ELSE -> C.',
    xpReward: 500,
  },
  // --- NEW NESTED LEVELS ---
  {
    id: 15,
    name: 'Nested Night',
    description: 'Requires Nesting: If Red -> Check Type (Fruit->A, else B). If Not Red -> C.',
    difficulty: 'Hacker',
    queue: [ITEMS.apple, ITEMS.crab, ITEMS.frog, ITEMS.banana, ITEMS.bear],
    bins: [
      { id: 'Bin A', label: 'Red Fruit', color: 'red', accepts: (i) => i.color === 'Red' && i.type === 'Fruit' },
      { id: 'Bin B', label: 'Red Other', color: 'pink', accepts: (i) => i.color === 'Red' && i.type !== 'Fruit' },
      { id: 'Bin C', label: 'Not Red', color: 'green', accepts: (i) => i.color !== 'Red' },
    ],
    hint: 'Use "Check..."! IF Color IS Red -> CHECK [ IF Type IS Fruit -> A, ELSE -> B ]',
    xpReward: 1500,
  },
  {
    id: 16,
    name: 'The Firewall',
    description: 'Filter Logic: Toys go to D. For non-toys: Red->A, Green->B, Yellow->C.',
    difficulty: 'Hacker',
    queue: [ITEMS.bear, ITEMS.apple, ITEMS.frog, ITEMS.ball, ITEMS.banana],
    bins: [
      { id: 'Bin A', label: 'Red Stuff', color: 'red', accepts: (i) => i.type !== 'Toy' && i.color === 'Red' },
      { id: 'Bin B', label: 'Green Stuff', color: 'green', accepts: (i) => i.type !== 'Toy' && i.color === 'Green' },
      { id: 'Bin C', label: 'Yellow Stuff', color: 'yellow', accepts: (i) => i.type !== 'Toy' && i.color === 'Yellow' },
      { id: 'Bin D', label: 'All Toys', color: 'blue', accepts: (i) => i.type === 'Toy' },
    ],
    hint: 'Handle the exception first! IF Type IS Toy -> D. ELSE -> CHECK Colors...',
    xpReward: 2000,
  }
];

const DEFAULTS = {
  Type: 'Fruit',
  Color: 'Red',
  Name: 'Apple'
};

// --- RECURSIVE RULE EDITOR COMPONENT ---

const RuleEditor = ({ 
  rules, 
  onChange, 
  defaultBin, 
  onDefaultBinChange, 
  bins, 
  depth = 0 
}: { 
  rules: Rule[], 
  onChange: (rules: Rule[]) => void, 
  defaultBin: string, 
  onDefaultBinChange: (bin: string) => void,
  bins: { id: string }[], 
  depth?: number 
}) => {

  const addRule = () => {
    onChange([...rules, { id: Date.now(), property: 'Type', operator: 'Is', value: 'Fruit', action: 'Bin', destination: bins[0].id }]);
  };

  const removeRule = (id: number) => {
    onChange(rules.filter(r => r.id !== id));
  };

  const updateRule = (id: number, field: keyof Rule, value: any) => {
    onChange(rules.map(r => {
      if (r.id !== id) return r;
      
      const updated = { ...r, [field]: value };

      // Reset dependent fields if types change
      if (field === 'property') {
        const newProp = value as 'Type' | 'Color' | 'Name';
        updated.value = DEFAULTS[newProp];
      }
      if (field === 'action') {
        if (value === 'Check' && !updated.nestedRules) {
          updated.nestedRules = [];
          updated.nestedElse = bins[0].id;
        }
      }
      return updated;
    }));
  };

  // Handle nested updates recursively
  const handleNestedChange = (ruleId: number, newNestedRules: Rule[]) => {
    onChange(rules.map(r => r.id === ruleId ? { ...r, nestedRules: newNestedRules } : r));
  };

  const handleNestedElseChange = (ruleId: number, newElse: string) => {
    onChange(rules.map(r => r.id === ruleId ? { ...r, nestedElse: newElse } : r));
  };

  return (
    <div className={`space-y-3 ${depth > 0 ? 'mt-3 border-l-2 border-dashed border-slate-300 pl-4' : ''}`}>
      {rules.map((rule, index) => (
        <Card key={rule.id} className="relative overflow-visible shadow-sm border-slate-200">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* IF / ELSE IF Label */}
              <span className={`font-mono font-bold px-2 py-1 rounded text-xs uppercase tracking-wider border ${depth > 0 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                {index === 0 ? 'IF' : 'ELSE IF'}
              </span>
              
              {/* Property Selector */}
              <select 
                className="p-1.5 border rounded bg-white text-sm font-medium hover:border-blue-400 cursor-pointer"
                value={rule.property}
                onChange={(e) => updateRule(rule.id, 'property', e.target.value)}
              >
                <option value="Type">Type</option>
                <option value="Color">Color</option>
                <option value="Name">Name</option>
              </select>

              <span className="text-gray-400 text-xs italic">is</span>

              {/* Value Selector */}
              <select 
                className="p-1.5 border rounded bg-white text-sm min-w-[90px] cursor-pointer"
                value={rule.value}
                onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
              >
                {rule.property === 'Type' && ['Fruit', 'Veggie', 'Toy', 'Animal'].map(o => <option key={o} value={o}>{o}</option>)}
                {rule.property === 'Color' && ['Red', 'Green', 'Yellow'].map(o => <option key={o} value={o}>{o}</option>)}
                {rule.property === 'Name' && ['Apple', 'Banana', 'Broccoli', 'Carrot', 'Pepper', 'Lemon', 'Bear', 'Ball', 'Frog', 'Chick', 'Crab'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>

              <span className="text-gray-400 text-xs">→</span>

              {/* Action Type (Bin vs Nested) */}
              <select
                className="p-1.5 border rounded bg-slate-50 text-sm font-bold text-slate-700 cursor-pointer"
                value={rule.action}
                onChange={(e) => updateRule(rule.id, 'action', e.target.value)}
              >
                <option value="Bin">Send to...</option>
                <option value="Check">Check...</option>
              </select>

              {/* Destination (if Bin) */}
              {rule.action === 'Bin' && (
                <select 
                  className="p-1.5 border rounded bg-white text-sm font-bold text-blue-600 cursor-pointer"
                  value={rule.destination}
                  onChange={(e) => updateRule(rule.id, 'destination', e.target.value)}
                >
                  {bins.map(bin => <option key={bin.id} value={bin.id}>{bin.id}</option>)}
                </select>
              )}

              <button onClick={() => removeRule(rule.id)} className="ml-auto text-gray-400 hover:text-red-500 hover:bg-red-50 rounded p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nested Rules Renderer */}
            {rule.action === 'Check' && (
              <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                  <CornerDownRight className="w-3 h-3" />
                  <span>THEN CHECK:</span>
                </div>
                <RuleEditor 
                  rules={rule.nestedRules || []}
                  onChange={(newRules) => handleNestedChange(rule.id, newRules)}
                  defaultBin={rule.nestedElse || bins[0].id}
                  onDefaultBinChange={(newBin) => handleNestedElseChange(rule.id, newBin)}
                  bins={bins}
                  depth={depth + 1}
                />
              </div>
            )}

          </CardContent>
        </Card>
      ))}

      {/* Add Rule Button */}
      <Button size="sm" onClick={addRule} variant="outline" className="w-full border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300">
        <Plus className="w-4 h-4 mr-2" /> Add {rules.length === 0 ? 'Rule' : 'Else If'}
      </Button>

      {/* Else Block */}
      <div className="p-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 text-sm font-mono flex items-center gap-2 bg-slate-50/50 mt-2">
        <span className="font-bold text-slate-600">ELSE</span>
        <span>→ Send to</span>
        <select 
            className="p-1.5 border rounded bg-white text-sm font-bold text-slate-700 cursor-pointer"
            value={defaultBin}
            onChange={(e) => onDefaultBinChange(e.target.value)}
        >
            {bins.map(bin => <option key={bin.id} value={bin.id}>{bin.id}</option>)}
        </select>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---

export function EmojiFactory() {
  const navigate = useNavigate();
  
  // Game State
  const [currentLevelId, setCurrentLevelId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'won'>('menu');
  
  // Factory State
  const [rules, setRules] = useState<Rule[]>([]);
  const [defaultBin, setDefaultBin] = useState<string>('');
  const [beltItems, setBeltItems] = useState<Item[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed] = useState(1000);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Stats
  const [xpEarned, setXpEarned] = useState(0);
  const [stats, setStats] = useState<FactoryStats>(() => {
    try {
      const raw = localStorage.getItem('emojiFactoryStats');
      return raw ? JSON.parse(raw) : { gamesPlayed: 0, levelsSolved: 0, totalXP: 0 };
    } catch {
      return { gamesPlayed: 0, levelsSolved: 0, totalXP: 0 };
    }
  });

  const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  // Initialize Level
  const startLevel = (id: number) => {
    setCurrentLevelId(id);
    const level = LEVELS.find(l => l.id === id)!;
    setBeltItems([...level.queue]);
    
    // Initial state: One simple rule
    setRules([{ 
      id: 1, 
      property: 'Type', 
      operator: 'Is', 
      value: 'Fruit', 
      action: 'Bin',
      destination: level.bins[0].id 
    }]);
    setDefaultBin(level.bins[level.bins.length - 1].id);
    
    setLogs([]);
    setIsRunning(false);
    setGameState('playing');
  };

  // --- LOGIC ENGINE (RECURSIVE) ---

  const evaluateRules = (item: Item, currentRules: Rule[], currentDefault: string): string => {
    for (const rule of currentRules) {
      let match = false;
      if (rule.property === 'Type' && item.type === rule.value) match = true;
      if (rule.property === 'Color' && item.color === rule.value) match = true;
      if (rule.property === 'Name' && item.name === rule.value) match = true;

      if (match) {
        // If action is Check, we recurse!
        if (rule.action === 'Check' && rule.nestedRules) {
          return evaluateRules(item, rule.nestedRules, rule.nestedElse || '');
        }
        // Otherwise return bin destination
        return rule.destination || '';
      }
    }
    // No rules matched, use the else bin for this block
    return currentDefault;
  };

  const processNextItem = () => {
    if (beltItems.length === 0) {
      finishLevel();
      return;
    }

    const currentItem = beltItems[0];
    const decision = evaluateRules(currentItem, rules, defaultBin);
    
    // Check correctness
    const targetBin = currentLevel.bins.find(b => b.id === decision);
    let isCorrect = false;

    if (targetBin) {
      isCorrect = targetBin.accepts(currentItem);
    }

    // Animation / State Update
    setLogs(prev => [`${currentItem.icon} -> ${decision} (${isCorrect ? 'OK' : 'FAIL'})`, ...prev.slice(0, 5)]);
    
    if (!isCorrect) {
      setIsRunning(false);
      // alert removed for better UX, using logs to show error
      return;
    }

    // Move next
    setBeltItems(prev => prev.slice(1));

    if (beltItems.length === 1) {
      // Last item processed successfully
      setTimeout(finishLevel, 800);
    }
  };

  const finishLevel = () => {
    setIsRunning(false);
    const earned = currentLevel.xpReward;
    setXpEarned(earned);

    const newStats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      levelsSolved: stats.levelsSolved + 1,
      totalXP: stats.totalXP + earned,
    };
    setStats(newStats);
    localStorage.setItem('emojiFactoryStats', JSON.stringify(newStats));
    setGameState('won');
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && beltItems.length > 0) {
      timer = setTimeout(processNextItem, simulationSpeed);
    }
    return () => clearTimeout(timer);
  }, [isRunning, beltItems, simulationSpeed]);


  // --- RENDERERS ---

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-6xl">
          <Card className="mb-8 border-slate-200 shadow-sm bg-white">
            <CardHeader className="text-center pb-6 border-b border-slate-100">
              <CardTitle className="text-5xl font-black text-slate-800 flex items-center justify-center gap-4">
                🏭 Emoji Factory
              </CardTitle>
              <p className="text-gray-500 mt-4 text-lg">Master logic gates and automation!</p>
              
              <div className="flex justify-center gap-8 mt-6 text-sm font-bold text-gray-400">
                <div className="flex flex-col items-center">
                  <span className="text-2xl text-purple-600">{stats.levelsSolved}</span>
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
                onClick={() => startLevel(level.id)}
                className={`group relative overflow-hidden p-6 rounded-2xl bg-white border-2 hover:border-purple-400 transition-all text-left shadow-sm hover:shadow-xl hover:-translate-y-1
                  ${level.difficulty === 'Hacker' ? 'border-slate-900' : 'border-slate-100'}
                `}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${level.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 
                      level.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                      level.difficulty === 'Hard' ? 'bg-orange-100 text-orange-700' : 
                      level.difficulty === 'Hacker' ? 'bg-slate-800 text-white' :
                      'bg-red-100 text-red-700'}
                  `}>
                    {level.difficulty}
                  </span>
                  {level.difficulty === 'Hacker' ? <Trophy className="w-5 h-5 text-slate-800" /> : <Settings className="w-6 h-6 text-gray-300 group-hover:text-purple-500" />}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{level.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{level.description}</p>
                <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                  {level.queue.slice(0, 5).map((i, idx) => (
                    <span key={idx} className="text-lg grayscale group-hover:grayscale-0">{i.icon}</span>
                  ))}
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
      <div className="min-h-screen bg-slate-100 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => setGameState('menu')}>
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{currentLevel.name}</h2>
              <p className="text-xs text-gray-500">Program the sorter logic.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right mr-4 hidden sm:block">
                <p className="text-xs text-gray-400 font-bold uppercase">Pending</p>
                <p className="text-xl font-bold text-blue-600">{beltItems.length}</p>
             </div>
             <Button 
                onClick={() => setIsRunning(!isRunning)} 
                className={`min-w-[140px] text-lg ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
             >
                <Play className="w-4 h-4 mr-2 fill-current" />
                {isRunning ? 'STOP' : 'RUN'}
             </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Recursive Logic Editor */}
          <div className="w-1/2 min-w-[450px] bg-slate-50 flex flex-col border-r border-slate-200 p-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Settings className="w-4 h-4" /> Logic Controller
            </h3>
            
            <RuleEditor 
              rules={rules}
              onChange={setRules}
              defaultBin={defaultBin}
              onDefaultBinChange={setDefaultBin}
              bins={currentLevel.bins}
            />
            
            <div className="h-24"></div> {/* Spacer */}
          </div>

          {/* RIGHT: Visual Factory */}
          <div className="flex-1 bg-white relative flex flex-col">
            
            {/* Log Feed */}
            <div className="absolute top-4 right-4 z-10 w-64 pointer-events-none">
                {logs.map((log, i) => (
                    <div key={i} className={`text-xs p-2 rounded mb-1 opacity-90 font-mono border-l-4 shadow-sm ${log.includes('FAIL') ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-800 border-slate-600 text-white'}`}>
                        {log}
                    </div>
                ))}
            </div>

            {/* Conveyor Belt Area */}
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border-b-8 border-slate-200 relative overflow-hidden">
                {/* Belt Track */}
                <div className="w-full h-32 bg-gray-200 flex items-center justify-center relative border-y-4 border-gray-300">
                    <div className={`absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,black,black_10px,transparent_10px,transparent_20px)] ${isRunning ? 'animate-pulse' : ''}`}></div>
                    {beltItems.length > 0 && (
                        <div className="w-24 h-24 bg-white rounded-xl shadow-xl flex items-center justify-center text-6xl z-10 border-4 border-white transition-all duration-500">
                            {beltItems[0].icon}
                        </div>
                    )}
                </div>

                {/* Queue */}
                <div className="flex gap-2 mt-6">
                    {beltItems.slice(1, 8).map((item, i) => (
                        <div key={i} className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center opacity-40 grayscale text-sm">
                            {item.icon}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bins Area */}
            <div className="h-1/3 bg-white flex justify-center items-end p-8 pb-12 gap-4 overflow-x-auto">
                {currentLevel.bins.map(bin => {
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-100 border-blue-300 text-blue-600',
                    red: 'bg-red-100 border-red-300 text-red-600',
                    green: 'bg-green-100 border-green-300 text-green-600',
                    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-600',
                    slate: 'bg-slate-100 border-slate-300 text-slate-600',
                    orange: 'bg-orange-100 border-orange-300 text-orange-600',
                    purple: 'bg-purple-100 border-purple-300 text-purple-600',
                    pink: 'bg-pink-100 border-pink-300 text-pink-600',
                  };
                  const styleClass = colorMap[bin.color] || colorMap['slate'];
                  
                  return (
                    <div key={bin.id} className="relative group min-w-[100px]">
                        <div className={`w-full h-32 md:h-40 rounded-b-xl border-4 border-t-0 shadow-inner flex items-end justify-center pb-4 ${styleClass.split(' ').slice(0,2).join(' ')}`}>
                            <span className="text-4xl group-hover:scale-110 transition-transform">📥</span>
                        </div>
                        <div className="absolute -top-8 left-0 right-0 text-center">
                            <div className={`inline-block px-3 py-1 rounded-full font-bold text-xs shadow-sm border bg-white ${styleClass.split(' ')[2]}`}>
                                {bin.id}
                            </div>
                            <div className="text-xs mt-1 font-bold text-slate-400 truncate">{bin.label}</div>
                        </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'won') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-green-200 shadow-xl text-center">
          <CardContent className="pt-12 pb-10">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Trophy className="w-12 h-12 text-green-600" />
            </div>
            
            <h2 className="text-4xl font-black text-slate-800 mb-2">Logic Master!</h2>
            <p className="text-slate-500 mb-8 text-lg">Factory output optimized successfully.</p>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">XP Earned</div>
                <div className="text-3xl font-bold text-yellow-500">+{xpEarned}</div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => {
                  const next = currentLevelId! + 1;
                  // Try to find specific next level (might skip IDs)
                  const nextLevel = LEVELS.find(l => l.id > currentLevelId!) 
                  if (nextLevel) startLevel(nextLevel.id);
                  else setGameState('menu');
              }} className="bg-green-600 hover:bg-green-700 text-white h-12 px-8 text-lg rounded-xl shadow-lg">
                Next Level
              </Button>
              <Button onClick={() => setGameState('menu')} variant="outline" className="h-12 px-8 text-lg rounded-xl">
                <RotateCcw className="w-4 h-4 mr-2" /> Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default EmojiFactory;