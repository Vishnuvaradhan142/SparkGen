import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, HelpCircle, ArrowLeft, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { useToast } from '@/hooks/useToast';
import { submitSpeedType } from '@/api/speedtype';

// Word list for Wordle — keep your full list here
const WORD_LIST = [
  'about','above','abuse','actor','acute','admit','adopt','adult','after','again',
  'agent','agree','ahead','alarm','album','alert','alike','alive','allow','alone',
  'along','alter','among','anger','angle','angry','apart','apple','apply','arena',
  'argue','arise','array','aside','asset','audio','audit','avoid','award','aware',
  'awoke','badly','baker','bases','basis','beach','began','begin','being','below',
  'bench','billy','birth','black','blame','blank','blast','bleed','blend','bless',
  'blind','blink','block','blood','blown','board','boost','booth','bound','brain',
  'brand','brass','brave','bread','break','breed','brief','bring','brink','brisk',
  'broad','broke','brown','build','built','buyer','cable','calif','carry','catch',
  'cause','chain','chair','chaos','charm','chart','chase','cheap','cheat','check',
  'chest','chief','child','china','chose','civil','claim','class','clean','clear',
  'click','climb','clock','close','cloth','cloud','coach','coast','could','count',
  'court','cover','craft','crash','crazy','cream','crime','crisp','cross','crowd',
  'crown','crude','curve','daily','dance','dated','dealt','death','debut','delay',
  'dense','depth','doing','doubt','dozen','draft','drama','drank','drawn','dream',
  'dress','drift','drill','drink','drive','drown','eager','early','earth','eight',
  'elbow','elder','empty','enemy','enjoy','enter','entry','equal','error','event',
  'every','exact','exist','extra','faith','fault','fiber','field','fiery','fifth',
  'fifty','fight','final','first','fixed','flame','flash','fleet','floor','fluid',
  'focus','force','forth','forty','forum','found','frame','frank','fraud','fresh',
  'front','frost','fruit','fully','funds','funny','ghost','giant','given','glass',
  'globe','glory','going','grace','grade','grain','grant','grass','grave','great',
  'green','greet','grief','grill','grind','group','grown','guard','guess','guest',
  'guide','guild','guilt','happy','harry','harsh','heart','heavy','hence','hinge',
  'hired','hobby','honey','honor','horse','hotel','house','human','ideal','image',
  'imply','index','inner','input','issue','items','japan','joint','judge','juice',
  'jumbo','keyed','knife','known','label','labor','large','laser','later','laugh',
  'layer','learn','lease','least','leave','legal','lemon','level','lewis','light',
  'limit','links','lives','local','logic','loose','lower','loyal','lunch','lying',
  'magic','major','maker','march','marry','match','maybe','mayor','meant','media',
  'metal','might','minor','minus','mixed','mixer','modal','model','money','month',
  'moral','motor','mount','mouse','mouth','moved','moved','music','needs','never',
  'newly','night','ninth','noble','noise','north','noted','notes','novel','occur',
  'ocean','offer','often','order','other','ought','ounce','outed','outer','outfit',
  'oxide','ozone','panel','panic','paper','party','patch','peace','pearl','phase',
  'phone','photo','piano','piece','pilot','pitch','pizza','place','plain','plane',
  'plant','plate','plays','plaza','point','pound','power','press','price','pride',
  'prime','print','prior','prize','proof','prose','proud','prove','queen','query',
  'quest','queue','quick','quiet','quite','radio','raise','range','rapid','ratio',
  'reach','react','realm','refer','right','risen','river','roast','robin','rocky',
  'roger','roman','rough','round','route','royal','rugby','ruled','ruler','rural',
  'rusty','safer','saint','salad','scale','scare','scene','scope','score','screw',
  'seals','seams','seats','seeds','seeks','seems','seize','sells','sends','sense',
  'serve','seven','shade','shake','shall','shame','shape','share','sharp','shave',
  'shear','sheds','sheet','shelf','shell','shift','shine','ships','shock','shoot',
  'shops','shore','short','shown','sight','signs','since','sixth','sized','sizes',
  'skill','skins','skull','skies','sleek','sleep','slept','slice','slide','slope',
  'small','smart','smile','smith','smoke','snake','sneak','sober','solar','solid',
  'solve','songs','sorts','sound','south','space','spare','spark','speak','spear',
  'speed','spell','spend','spent','split','spoke','spoon','sport','squad','stage',
  'stake','stand','stare','stark','start','state','steam','steel','steep','steer',
  'stems','steps','stick','still','sting','stock','stone','stood','store','storm',
  'story','strap','straw','strip','stuck','study','stuff','style','sugar','suite',
  'super','swamp','swear','sweat','sweep','sweet','swept','swift','swing','swirl',
  'table','taken','takes','tales','talks','tanks','tapes','tasks','taste','teach',
  'teams','tears','teeth','tells','tends','tense','tenth','terms','texas','thank',
  'theft','their','theme','these','thick','thief','thing','think','third','thorn',
  'those','three','threw','throw','thumb','tidal','tiger','tight','timer','times',
  'tired','title','toast','today','token','tommy','topic','torch','total','touch',
  'tough','tours','tower','towns','toxic','track','trade','trail','train','trait',
  'trash','treat','trees','trend','trial','tribe','trick','tried','tries','troop',
  'truck','truly','trump','trunk','trust','truth','tubes','turns','tweed','tweet',
  'twice','twins','twist','typed','types','under','undue','unfed','unite','unity',
  'until','upper','upset','urban','urged','usage','users','usual','utils','valid',
  'value','vault','video','views','viral','virus','visit','vital','vocal','vowed',
  'wager','wages','wagon','waist','wakes','wales','walks','walls','wants','warms',
  'warns','waste','watch','water','watts','waves','weary','weeds','weeks','weigh',
  'weird','wells','welsh','whack','whale','wheel','where','which','while','whine',
  'white','whole','whose','wicks','wider','width','wield','winds','wines','wings',
  'wiped','wipes','wires','wiser','witch','wives','woman','women','woods','world',
  'worry','worse','worst','worth','would','wound','woven','wraps','wrath','wreck',
  'wrist','write','wrong','wrote','yield','young','yours','youth','zeros','zones',
  'acres','added','admit','adopt','adore','after','again','agent','agile','agree',
  'ahead','album','alert','alien','alike','alive','alloy','allow','alpha','amber',
  'amend','angel','anger','angle','angry','ankle','annoy','anode','apart','aphid',
  'apple','apply','apron','arise','armor','array','arrow','aside','asset','atlas',
  'attic','audio','audit','aunt','autos','avail','avoid','awake','award','aware',
  'badge','badly','bagel','baker','bandy','bangs','banks','baron','based','basic',
  'basin','basis','batch','bathe','baton','beach','beard','beast','beech','begin',
  'being','below','bench','berry','binge','birth','black','blade','blame','blank',
  'blast','blaze','bleak','bleat','blend','bless','blind','blink','bliss','block',
  'blood','bloom','blown','blues','board','boats','bogus','boing','bolts','bonds',
  'bones','bonus','books','booth','boots','booze','booty','booth','bound','bouts',
  'boxed','brain','brake','brand','brass','brave','bread','break','breed','brick',
  'bride','brief','bring','brink','brisk','broad','broke','brood','brook','broom',
  'broth','brown','bruce','brunt','brush','buddy','budge','build','built','bulky',
  'bulls','bumps','bunch','bunny','buyer','cables','cages','cakes','calif','calls',
  'calmly','camel','camps','canal','candy','canny','canoe','canon','caper','caped',
  'cards','cares','cargo','carol','carry','carts','carve','cases','catch','cater',
  'cause','caves','chain','chair','champ','chant','chaos','chapt','charm','chars',
  'chart','chase','chasm','cheap','cheat','check','cheek','cheer','chess','chest',
  'chick','chief','child','chill','chilly','chimp','china','chins','chips','chirp',
  'chock','choir','choke','chomp','chops','chose','chuck','chump','chunk','churn',
  'cider','cigar','civic','civil','claim','clamp','clams','clang','clank','claps',
  'class','claws','clean','clear','cleat','cleft','clerk','click','cliff','climb',
  'cling','cloak','clock','clone','close','cloth','clots','cloud','clout','clove',
  'clown','clubs','cluck','clues','clump','clung','coach','coals','coast','coats',
  'cobra','cocky','coded','coder','codes','coils','coins','colds','colic','colon',
  'color','colts','comas','combs','comet','comic','comma','conch','cones','conga',
  'congo','coral','cords','cores','corgi','corns','corny','corps','couch','cough',
  'could','count','coups','court','couth','coven','cover','cowed','cower','crack',
  'craft','cramp','crane','crank','crash','crass','crate','crave','crawl','crazy',
  'creak','cream','creed','creek','creep','crepe','crept','cress','crest','crews',
  'cribs','cries','crime','crimp','crisp','croak','crock','croak','crones','crook',
  'croon','cross','croup','crows','crowd','crown','crude','cruds','cruel','cruise',
  'crumb','crush','crust','crypt','cubes','cubic','curbs','curds','cured','curer',
  'cures','curls','curly','curse','curve','cusp','custom','cycle','daddy','daily',
  'daisy','dales','damps','dance','dandy','dared','dares','dated','dates','daubs',
  'daunt','davit','dawns','dazed','dazes','dealt','dears','death','debit','debts',
  'debut','decal','decoy','decry','dedks','deeds','deeps','defer','deify','deity',
  'delay','deled','deles','delhi','dells','delta','delve','demos','demur','denim',
  'dense','dents','deny','depot','depth','derby','deter','detox','deuce','devon',
  'dewed','dials','diary','diced','dicer','dices','dicey','dicky','didos','diets',
  'diety','digit','dildo','dilly','dimer','dimly','dimps','dinar','dined','diner',
  'dines','dingy','dints','diode','dippy','dirts','dirty','disco','discr','disks',
  'ditch','ditto','ditty','divas','dived','diver','dives','divot','dizzy','docks',
  'dodge','dodos','doers','dogma','doily','doing','dolls','dolly','domed','domes',
  'don','donna','donor','doors','doped','doper','dopes','dorks','dorky','dorms',
  'dosed','doses','doted','dotes','dotty','doubt','dough','douse','doves','dowdy',
  'dowed','dowel','dower','downs','downy','dowry','dowse','dozed','dozes','doxie',
  'draft','drags','drain','drake','drams','drank','drape','drats','drave','drawl',
  'drawn','draws','drays','dread','dream','drear','dreck','dreed','dreel','dregs',
  'dress','dried','drier','dries','drift','drill','drink','drips','drive','droit',
  'droll','drone','drool','droop','drops','dross','drove','drown','drubs','drugs',
  'drums','drunk','drupe','dryer','dryly','duals','ducks','ducky','ducts','dudes',
  'duels','duets','duffs','duffy','dufus','dukes','dulls','dully','dumas','dumbo',
  'dumbs','dumpy','dunce','dunes','dunks','duolo','duomo','duped','duper','dupes',
  'duple','dural','dusky','dusts','dusty','dutch','duvet','dwarf','dwell','dwelt',
  'dying','dynes','eager','eagle','eared','earls','early','earns','earth','eases',
  'eaten','eater','eaves','ebbed','ebony','eclat','edema','edged','edger','edges',
  'edify','edict','edits','educt','eely','eerie','egads','egged','egger','egits',
  'egos','egret','eider','eight','eject','eking','eland','elate','elbow','elders',
  'elect','elegy','elemi','elfin','elite','elope','elude','email','emcee','emend',
  'emery','emied','emies','emirs','emits','emmer','emmet','emote','emour','emped',
  'empty','emyde','emyds','enact','ended','ender','endew','endow','endue','enema',
  'enemy','enrol','ensue','enter','entry','envoy','epact','epees','epics','epoch',
  'epode','epopt','epoxy','equal','equid','erase','erect','erode','erogs','erred',
  'errer','error','eruct','erupt','eryngoes'
];

type LetterStateType = 'correct' | 'present' | 'absent' | 'empty';

interface LetterState {
  letter: string;
  state: LetterStateType;
}

interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: { [key: number]: number };
  lastPlayedDate: string;
}

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

export function Wordle() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // UI state
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [letterStates, setLetterStates] = useState<{ [key: string]: LetterStateType | undefined }>({});
  const [evaluatedGuesses, setEvaluatedGuesses] = useState<LetterState[][]>([]);

  // stats
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const raw = localStorage.getItem('wordleStats');
      if (raw) return JSON.parse(raw) as GameStats;
    } catch {}
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      lastPlayedDate: '',
    };
  });

  // UI flags
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [shake, setShake] = useState(false);

  // refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const currentGuessRef = useRef(currentGuess);

  // THE SINGLE SOURCE OF TRUTH FOR THE TARGET WORD DURING A GAME:
  // keep it in a ref so renders / effects won't accidentally change it.
  const targetWordRef = useRef<string>('');

  // keep currentGuessRef in sync
  useEffect(() => { currentGuessRef.current = currentGuess; }, [currentGuess]);

  // Helper: initialize a new target word and reset board — called only on mount or explicit New Game
  const startNewGame = () => {
    const newWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toUpperCase();
    targetWordRef.current = newWord; // set once for the game
    setGuesses([]);
    setCurrentGuess('');
    currentGuessRef.current = '';
    setGameState('playing');
    setLetterStates({});
    setEvaluatedGuesses([]);
    setShowStats(false);
    // focus to enable keyboard on some mobile devices
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Start a game at mount (only once)
  useEffect(() => {
    startNewGame();
    // intentionally empty deps => run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utility: check letter state using the locked-in target word
  const getLetterState = (letter: string, idx: number): LetterStateType | 'absent' => {
    const target = targetWordRef.current;
    if (!target || target.length !== WORD_LENGTH) return 'absent';
    if (target[idx] === letter) return 'correct';
    if (target.includes(letter)) return 'present';
    return 'absent';
  };

  // Evaluate a guess and update keyboard state (uses targetWordRef)
  const evaluateGuess = (guess: string) => {
    const upper = guess.toUpperCase();
    const row: LetterState[] = [];
    const nextLetterStates = { ...letterStates };

    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = upper[i];
      const state = getLetterState(letter, i);
      row.push({ letter, state });

      const key = letter.toUpperCase();
      // priority: correct > present > absent
      if (!nextLetterStates[key] || state === 'correct' || (state === 'present' && nextLetterStates[key] !== 'correct')) {
        nextLetterStates[key] = state;
      }
    }

    setLetterStates(nextLetterStates);
    return row;
  };

  // Update stats safely (functional update)
  const updateStats = (won: boolean, guessCount: number) => {
    const today = new Date().toDateString();
    setStats((prev) => {
      const isNewDay = prev.lastPlayedDate !== today;
      const gamesPlayed = prev.gamesPlayed + 1;
      const gamesWon = won ? prev.gamesWon + 1 : prev.gamesWon;

      // If won: increment streak (we treat it as continuous streak incrementing each win)
      const currentStreak = won ? (isNewDay ? prev.currentStreak + 1 : prev.currentStreak + 1) : 0;
      const maxStreak = won ? Math.max(prev.maxStreak, currentStreak) : prev.maxStreak;

      const distribution = { ...prev.guessDistribution };
      if (won && guessCount >= 1 && guessCount <= MAX_GUESSES) {
        distribution[guessCount] = (distribution[guessCount] || 0) + 1;
      }

      const newStats: GameStats = {
        gamesPlayed,
        gamesWon,
        currentStreak,
        maxStreak,
        guessDistribution: distribution,
        lastPlayedDate: today,
      };
      try { localStorage.setItem('wordleStats', JSON.stringify(newStats)); } catch (e) {}
      return newStats;
    });

    if (won) {
      submitSpeedType({
        difficulty: 'medium',
        wpm: Math.max(1, 7 - guessCount) * 10,
        accuracy: (guessCount / MAX_GUESSES) * 100,
        wordsCorrect: 1,
        totalWords: 1,
      }).catch((err) => console.error('Error saving wordle game:', err));
    }
  };

  // Handle key presses (keyboard or on-screen) — uses refs to avoid stale closure
  const handleKeyPress = (key: string) => {
    if (gameState !== 'playing') return;

    if (key === 'Enter') {
      const guess = currentGuessRef.current;
      if (guess.length !== WORD_LENGTH) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        toast({ title: 'Not enough letters', variant: 'destructive' });
        return;
      }
      if (!WORD_LIST.includes(guess.toLowerCase())) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        toast({ title: 'Not in word list', variant: 'destructive' });
        return;
      }

      // Append guess and evaluate using the locked targetWordRef
      setGuesses((prev) => {
        const next = [...prev, guess];
        return next;
      });

      const evaluated = evaluateGuess(guess);
      setEvaluatedGuesses((prev) => [...prev, evaluated]);

      // Decide win / loss using targetWordRef
      if (guess.toUpperCase() === targetWordRef.current) {
        setGameState('won');
        updateStats(true, guesses.length + 1); // guesses.length is previous count
        setTimeout(() => {
          toast({ title: 'Congratulations! 🎉' });
          setShowStats(true);
        }, 600);
      } else if (guesses.length + 1 >= MAX_GUESSES) {
        setGameState('lost');
        updateStats(false, 0);
        setTimeout(() => {
          toast({ title: `The word was ${targetWordRef.current}`, variant: 'destructive' });
          setShowStats(true);
        }, 600);
      }

      setCurrentGuess('');
      currentGuessRef.current = '';
      return;
    }

    if (key === 'Backspace') {
      const next = currentGuessRef.current.slice(0, -1);
      setCurrentGuess(next);
      currentGuessRef.current = next;
      return;
    }

    // letter input
    if (/^[A-Z]$/i.test(key)) {
      if (currentGuessRef.current.length >= WORD_LENGTH) return;
      const next = (currentGuessRef.current + key.toUpperCase()).slice(0, WORD_LENGTH);
      setCurrentGuess(next);
      currentGuessRef.current = next;
    }
  };

  // Keydown listener — uses currentGuessRef/targetWordRef so we don't need currentGuess in deps
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showHelp || showStats) return;
      handleKeyPress(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showHelp, showStats, gameState]);

  // Render helpers
  const renderGuessRow = (idx: number) => {
    if (idx < evaluatedGuesses.length) {
      const evaluated = evaluatedGuesses[idx];
      return evaluated.map((ls, i) => (
        <div
          key={i}
          className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold rounded transition-all duration-300 ${
            ls.state === 'correct'
              ? 'bg-green-500 border-green-500 text-white animate-flip'
              : ls.state === 'present'
              ? 'bg-yellow-500 border-yellow-500 text-white animate-flip'
              : 'bg-gray-500 border-gray-500 text-white animate-flip'
          }`}
          style={{ animationDelay: `${i * 90}ms` }}
        >
          {ls.letter}
        </div>
      ));
    }

    if (idx === guesses.length) {
      const g = currentGuess;
      return Array.from({ length: WORD_LENGTH }).map((_, i) => (
        <div
          key={i}
          className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold rounded transition-all ${
            shake ? 'animate-shake' : ''
          } ${g[i] ? 'border-gray-300 text-foreground scale-105' : 'border-gray-600'}`}
        >
          {g[i] || ''}
        </div>
      ));
    }

    return Array.from({ length: WORD_LENGTH }).map((_, i) => (
      <div key={i} className="w-14 h-14 border-2 border-gray-600 flex items-center justify-center text-2xl font-bold rounded" />
    ));
  };

  const getKeyClass = (key: string) => {
    if (key === 'Enter' || key === 'Backspace') {
      return 'px-4 bg-white text-black hover:bg-gray-200';
    }
    const st = letterStates[key.toUpperCase()];
    if (st === 'correct') return 'bg-green-500 hover:bg-green-600 text-white';
    if (st === 'present') return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    if (st === 'absent') return 'bg-gray-400 hover:bg-gray-500 text-white';
    return 'bg-white text-black hover:bg-gray-200';
  };

  // UI: Help / Stats / Game views (kept largely same as before)
  if (showHelp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How to Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Guess the WORDLE in 6 tries.</p>
              <p>Each guess must be a valid 5-letter word. Hit the Enter button to submit.</p>
              <p>After each guess, tiles change color to show closeness to the word.</p>
              <div className="border-t pt-4">
                <p className="font-bold mb-2">Examples:</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex gap-2 mb-2">
                      <div className="w-10 h-10 bg-green-500 text-white flex items-center justify-center font-bold rounded">W</div>
                      <div className="w-10 h-10 border-2 border-gray-600 flex items-center justify-center font-bold rounded">O</div>
                      <div className="w-10 h-10 border-2 border-gray-600 flex items-center justify-center font-bold rounded">R</div>
                      <div className="w-10 h-10 border-2 border-gray-600 flex items-center justify-center font-bold rounded">D</div>
                      <div className="w-10 h-10 border-2 border-gray-600 flex items-center justify-center font-bold rounded">S</div>
                    </div>
                    <p className="text-sm">The letter <strong>W</strong> is in the word and in the correct spot.</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowHelp(false)} className="w-full">Got it!</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showStats) {
    const winPercentage = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
    const maxDistribution = Math.max(...Object.values(stats.guessDistribution));
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div><p className="text-3xl font-bold">{stats.gamesPlayed}</p><p className="text-sm text-muted-foreground">Played</p></div>
                <div><p className="text-3xl font-bold">{winPercentage}</p><p className="text-sm text-muted-foreground">Win %</p></div>
                <div><p className="text-3xl font-bold">{stats.currentStreak}</p><p className="text-sm text-muted-foreground">Current Streak</p></div>
                <div><p className="text-3xl font-bold">{stats.maxStreak}</p><p className="text-sm text-muted-foreground">Max Streak</p></div>
              </div>

              <div>
                <h3 className="font-bold mb-3">Guess Distribution</h3>
                <div className="space-y-2">
                  {[1,2,3,4,5,6].map(num => {
                    const count = stats.guessDistribution[num] || 0;
                    const percentage = maxDistribution > 0 ? (count / maxDistribution) * 100 : 0;
                    const isCurrentGame = gameState === 'won' && guesses.length === num;
                    return (
                      <div key={num} className="flex items-center gap-2">
                        <span className="w-4 text-sm">{num}</span>
                        <div className="flex-1 h-6 bg-gray-700 rounded overflow-hidden">
                          <div
                            className={`h-full flex items-center justify-end pr-2 text-white text-sm font-bold transition-all ${isCurrentGame ? 'bg-green-500' : 'bg-gray-600'}`}
                            style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                          >
                            {count > 0 && count}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {gameState === 'won' && (
                <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">XP Earned</p>
                    <p className="text-3xl font-bold text-amber-400">+{(7 - guesses.length) * 20}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <Button onClick={() => startNewGame()} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">
                  <RotateCcw className="w-4 h-4 mr-2" /> New Game
                </Button>
                <Button onClick={() => navigate('/games')} variant="outline" className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Games
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main game UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/games')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">WORDLE</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)}><HelpCircle className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setShowStats(true)}><Trophy className="w-5 h-5" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Card className="order-2 lg:order-1">
            <CardContent className="pt-6">
              <div className="space-y-2">
                {[
                  ['Q','W','E','R','T','Y','U','I','O','P'],
                  ['A','S','D','F','G','H','J','K','L'],
                  ['Enter','Z','X','C','V','B','N','M','Backspace'],
                ].map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1 justify-center">
                    {row.map((k) => (
                      <button
                        key={k}
                        onClick={() => handleKeyPress(k)}
                        className={`h-14 min-w-[2.5rem] flex items-center justify-center text-sm font-bold rounded transition-colors ${getKeyClass(k)}`}
                        disabled={gameState !== 'playing'}
                      >
                        {k === 'Backspace' ? '⌫' : k}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="order-1 lg:order-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-2">
                {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    {renderGuessRow(i)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <input ref={inputRef} type="text" className="sr-only" autoComplete="off" />
      </div>

      <style>{`
        @keyframes flip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}
        .animate-flip{animation:flip .5s ease-in-out}
        @keyframes shake{0%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-5px)}20%,40%,60%,80%{transform:translateX(5px)}}
        .animate-shake{animation:shake .5s ease-in-out}
      `}</style>
    </div>
  );
}
