import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sliders, 
  Layers, 
  CheckCircle, 
  BarChart2, 
  Info, 
  Star, 
  ArrowUpDown, 
  ShieldCheck, 
  ShoppingBag, 
  Database,
  Cpu,
  Zap,
  Tag,
  Check,
  X
} from 'lucide-react';

const INITIAL_CATALOG = [
  { id: 'SKU-101', name: 'Ultra Wireless ANC Headphones', price: 299, rating: 4.8, reviews: 1420, category: 'Audio', badge: 'Best Seller' },
  { id: 'SKU-102', name: 'Mechanical RGB Gaming Keyboard', price: 89, rating: 4.5, reviews: 890, category: 'Peripherals', badge: 'Trending' },
  { id: 'SKU-103', name: 'Smart Fitness Tracker Watch V2', price: 149, rating: 4.2, reviews: 630, category: 'Wearables', badge: 'Sale' },
  { id: 'SKU-104', name: '4K Ultra-Wide Curved Monitor 34"', price: 499, rating: 4.8, reviews: 2150, category: 'Displays', badge: 'Featured' },
  { id: 'SKU-105', name: 'Ergonomic Vertical Wireless Mouse', price: 89, rating: 4.5, reviews: 310, category: 'Peripherals', badge: null },
  { id: 'SKU-106', name: 'Studio USB Condenser Microphone', price: 149, rating: 4.8, reviews: 940, category: 'Audio', badge: 'Popular' },
  { id: 'SKU-107', name: 'Aluminum Laptop Riser Stand', price: 35, rating: 4.1, reviews: 480, category: 'Accessories', badge: null },
  { id: 'SKU-108', name: 'High-Speed MagSafe Charging Pad', price: 89, rating: 4.8, reviews: 1120, category: 'Charging', badge: 'Hot' },
];

export default function App() {
  const [products, setProducts] = useState(INITIAL_CATALOG);
  
  // Multi-tier sort criteria state: list of objects { key: 'price'|'rating'|'reviews', order: 'asc'|'desc' }
  const [sortCriteria, setSortCriteria] = useState([
    { key: 'rating', order: 'desc' },
    { key: 'price', order: 'asc' }
  ]);
  
  const [history, setHistory] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(800);
  
  const [stats, setStats] = useState({ comparisons: 0, bufferWrites: 0, totalSteps: 0 });
  const playTimerRef = useRef(null);

  // Toggle or add/remove a sort criterion
  const toggleCriterion = (key) => {
    const existingIndex = sortCriteria.findIndex((c) => c.key === key);
    if (existingIndex !== -1) {
      // Don't remove if it's the only one active
      if (sortCriteria.length === 1) return;
      setSortCriteria(sortCriteria.filter((c) => c.key !== key));
    } else {
      // Add as next tier
      const defaultOrder = key === 'price' ? 'asc' : 'desc';
      setSortCriteria([...sortCriteria, { key, order: defaultOrder }]);
    }
  };

  // Toggle order for a specific criterion
  const toggleOrder = (key) => {
    setSortCriteria(
      sortCriteria.map((c) => (c.key === key ? { ...c, order: c.order === 'asc' ? 'desc' : 'asc' } : c))
    );
  };

  // Generate Merge Sort Steps with multi-criteria tie-breaking
  const generateMergeSteps = (initialArray, criteria) => {
    const steps = [];
    let compCount = 0;
    let writeCount = 0;
    const workingArr = JSON.parse(JSON.stringify(initialArray));

    const criteriaText = criteria.map((c, idx) => `[Tier ${idx + 1}: ${c.key.toUpperCase()} (${c.order.toUpperCase()})]`).join(' → ');

    steps.push({
      type: 'INIT',
      description: `Initialized Merge Sort on ${workingArr.length} catalog items. Priority Order: ${criteriaText}.`,
      array: JSON.parse(JSON.stringify(workingArr)),
      leftRange: [0, workingArr.length - 1],
      activeRange: [0, workingArr.length - 1],
      mid: null,
      i: null,
      j: null,
      k: null,
      leftBuf: [],
      rightBuf: [],
      depth: 0,
      comparisons: 0,
      writes: 0
    });

    const compareElements = (elemL, elemR) => {
      for (let level = 0; level < criteria.length; level++) {
        const { key, order } = criteria[level];
        const valL = elemL[key];
        const valR = elemR[key];

        if (valL !== valR) {
          const takeLeft = order === 'asc' ? valL < valR : valL > valR;
          return {
            takeLeft,
            tier: level + 1,
            key,
            valL,
            valR,
            reason: `Tier ${level + 1} (${key}): Left=${valL} vs Right=${valR} (${order.toUpperCase()})`
          };
        }
      }
      // If all chosen criteria are equal, choose Left to guarantee stability
      return {
        takeLeft: true,
        tier: 'Tie-break',
        key: 'stability',
        reason: 'All active criteria matched! Selected Left buffer item to strictly preserve catalog stability.'
      };
    };

    const merge = (arr, left, mid, right, depth) => {
      const leftBuf = arr.slice(left, mid + 1);
      const rightBuf = arr.slice(mid + 1, right + 1);

      steps.push({
        type: 'MERGE_START',
        description: `Conquer & Merge: Splitting active slice into Left Buffer [${left}..${mid}] and Right Buffer [${mid + 1}..${right}].`,
        array: JSON.parse(JSON.stringify(arr)),
        activeRange: [left, right],
        leftRange: [left, mid],
        rightRange: [mid + 1, right],
        mid: mid,
        i: 0,
        j: 0,
        k: left,
        leftBuf: JSON.parse(JSON.stringify(leftBuf)),
        rightBuf: JSON.parse(JSON.stringify(rightBuf)),
        depth,
        comparisons: compCount,
        writes: writeCount
      });

      let i = 0;
      let j = 0;
      let k = left;

      while (i < leftBuf.length && j < rightBuf.length) {
        compCount++;
        const comparison = compareElements(leftBuf[i], rightBuf[j]);
        const takeLeft = comparison.takeLeft;

        steps.push({
          type: 'COMPARE',
          description: `Comparing [${leftBuf[i].name.slice(0, 16)}...] vs [${rightBuf[j].name.slice(0, 16)}...]. Result: ${comparison.reason} → Placed ${takeLeft ? 'Left' : 'Right'}.`,
          array: JSON.parse(JSON.stringify(arr)),
          activeRange: [left, right],
          leftRange: [left, mid],
          rightRange: [mid + 1, right],
          mid,
          i,
          j,
          k,
          leftBuf: JSON.parse(JSON.stringify(leftBuf)),
          rightBuf: JSON.parse(JSON.stringify(rightBuf)),
          depth,
          comparisons: compCount,
          writes: writeCount
        });

        if (takeLeft) {
          arr[k] = leftBuf[i];
          writeCount++;
          i++;
        } else {
          arr[k] = rightBuf[j];
          writeCount++;
          j++;
        }

        steps.push({
          type: 'OVERWRITE',
          description: `Committed ${arr[k].name.slice(0, 20)} into main catalog array at index ${k}.`,
          array: JSON.parse(JSON.stringify(arr)),
          activeRange: [left, right],
          leftRange: [left, mid],
          rightRange: [mid + 1, right],
          mid,
          i,
          j,
          k,
          leftBuf: JSON.parse(JSON.stringify(leftBuf)),
          rightBuf: JSON.parse(JSON.stringify(rightBuf)),
          depth,
          comparisons: compCount,
          writes: writeCount
        });

        k++;
      }

      while (i < leftBuf.length) {
        arr[k] = leftBuf[i];
        writeCount++;
        steps.push({
          type: 'FLUSH_LEFT',
          description: `Right buffer exhausted. Flushing remaining ${arr[k].name.slice(0, 18)} from Left Buffer into index ${k}.`,
          array: JSON.parse(JSON.stringify(arr)),
          activeRange: [left, right],
          leftRange: [left, mid],
          rightRange: [mid + 1, right],
          mid,
          i,
          j,
          k,
          leftBuf: JSON.parse(JSON.stringify(leftBuf)),
          rightBuf: JSON.parse(JSON.stringify(rightBuf)),
          depth,
          comparisons: compCount,
          writes: writeCount
        });
        i++;
        k++;
      }

      while (j < rightBuf.length) {
        arr[k] = rightBuf[j];
        writeCount++;
        steps.push({
          type: 'FLUSH_RIGHT',
          description: `Left buffer exhausted. Flushing remaining ${arr[k].name.slice(0, 18)} from Right Buffer into index ${k}.`,
          array: JSON.parse(JSON.stringify(arr)),
          activeRange: [left, right],
          leftRange: [left, mid],
          rightRange: [mid + 1, right],
          mid,
          i,
          j,
          k,
          leftBuf: JSON.parse(JSON.stringify(leftBuf)),
          rightBuf: JSON.parse(JSON.stringify(rightBuf)),
          depth,
          comparisons: compCount,
          writes: writeCount
        });
        j++;
        k++;
      }

      steps.push({
        type: 'MERGE_DONE',
        description: `Subarray [${left}..${right}] successfully merged and ordered.`,
        array: JSON.parse(JSON.stringify(arr)),
        activeRange: [left, right],
        leftRange: null,
        rightRange: null,
        mid: null,
        i: null,
        j: null,
        k: null,
        leftBuf: [],
        rightBuf: [],
        depth,
        comparisons: compCount,
        writes: writeCount
      });
    };

    const divideAndConquer = (arr, left, right, depth) => {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);

      steps.push({
        type: 'DIVIDE',
        description: `Divide Phase: Bisecting slice [${left}..${right}] at midpoint ${mid}. Left: [${left}..${mid}], Right: [${mid + 1}..${right}].`,
        array: JSON.parse(JSON.stringify(arr)),
        activeRange: [left, right],
        leftRange: [left, mid],
        rightRange: [mid + 1, right],
        mid: mid,
        i: null,
        j: null,
        k: null,
        leftBuf: [],
        rightBuf: [],
        depth,
        comparisons: compCount,
        writes: writeCount
      });

      divideAndConquer(arr, left, mid, depth + 1);
      divideAndConquer(arr, mid + 1, right, depth + 1);
      merge(arr, left, mid, right, depth);
    };

    divideAndConquer(workingArr, 0, workingArr.length - 1, 0);

    steps.push({
      type: 'COMPLETE',
      description: `Algorithm Terminated: Catalog sorted by ${criteria.length} tier(s) in O(n log n) time.`,
      array: JSON.parse(JSON.stringify(workingArr)),
      activeRange: [0, workingArr.length - 1],
      leftRange: null,
      rightRange: null,
      mid: null,
      i: null,
      j: null,
      k: null,
      leftBuf: [],
      rightBuf: [],
      depth: 0,
      comparisons: compCount,
      writes: writeCount
    });

    return { steps, comparisons: compCount, writes: writeCount };
  };

  const recompute = (currentData, criteria) => {
    setIsPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    const { steps, comparisons, writes } = generateMergeSteps(currentData, criteria);
    setHistory(steps);
    setCurrentStepIndex(0);
    setStats({ comparisons, bufferWrites: writes, totalSteps: steps.length });
  };

  useEffect(() => {
    recompute(products, sortCriteria);
  }, [sortCriteria]);

  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < history.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            clearInterval(playTimerRef.current);
            return prev;
          }
        });
      }, playbackSpeed);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, history.length, playbackSpeed]);

  const currentStep = history[currentStepIndex] || {
    array: products,
    description: 'Ready to sort.',
    type: 'IDLE',
    comparisons: 0,
    writes: 0,
    leftBuf: [],
    rightBuf: []
  };

  const handlePreset = (type) => {
    let newItems = [];
    if (type === 'standard') {
      newItems = INITIAL_CATALOG;
    } else if (type === 'reverse') {
      newItems = [...INITIAL_CATALOG].sort((a, b) => b.price - a.price);
    } else if (type === 'duplicates') {
      // Items sharing equal prices and ratings to test tie-breaking
      newItems = [
        { id: 'SKU-01', name: 'Logitech G-Pro Wireless', price: 99, rating: 4.8, reviews: 1200, category: 'Tech' },
        { id: 'SKU-02', name: 'Razer DeathAdder V3', price: 99, rating: 4.8, reviews: 850, category: 'Tech' },
        { id: 'SKU-03', name: 'SteelSeries Aerox 3', price: 99, rating: 4.5, reviews: 400, category: 'Tech' },
        { id: 'SKU-04', name: 'Glorious Model O Wireless', price: 99, rating: 4.8, reviews: 920, category: 'Tech' },
        { id: 'SKU-05', name: 'Corsair Harpoon RGB', price: 49, rating: 4.2, reviews: 310, category: 'Tech' },
        { id: 'SKU-06', name: 'HyperX Pulsefire Haste', price: 49, rating: 4.5, reviews: 650, category: 'Tech' },
      ];
    }
    setProducts(newItems);
    recompute(newItems, sortCriteria);
  };

  const getCardHighlightClass = (idx) => {
    if (!currentStep) return 'border-slate-800 bg-slate-900/60';
    if (currentStep.type === 'COMPLETE') return 'border-emerald-500/80 bg-emerald-950/20 shadow-emerald-500/10 shadow-lg';
    if (currentStep.k === idx) return 'border-amber-400 bg-amber-950/30 ring-2 ring-amber-400/50 scale-[1.02] shadow-xl';
    if (currentStep.mid === idx) return 'border-purple-500/80 bg-purple-950/20 ring-1 ring-purple-400/40';
    if (currentStep.activeRange) {
      const [start, end] = currentStep.activeRange;
      if (idx >= start && idx <= end) return 'border-indigo-500/60 bg-indigo-950/20';
    }
    return 'border-slate-800/80 bg-slate-900/40 opacity-40';
  };

  const AVAILABLE_KEYS = [
    { id: 'rating', label: 'Rating (★)', icon: Star },
    { id: 'price', label: 'Price ($)', icon: Tag },
    { id: 'reviews', label: 'Reviews', icon: Database }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">SmartSort Commerce Engine</h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                Multi-Criteria Merge Sort
              </span>
            </div>
            <p className="text-xs text-slate-400">Select 1, 2, or 3 attributes simultaneously to create primary, secondary & tertiary tie-breakers</p>
          </div>
        </div>

        {/* Multi-Criteria Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" /> Active Tiers:
          </span>

          {AVAILABLE_KEYS.map(({ id, label, icon: Icon }) => {
            const activeIndex = sortCriteria.findIndex((c) => c.key === id);
            const isActive = activeIndex !== -1;
            const currentOrder = isActive ? sortCriteria[activeIndex].order : null;

            return (
              <div 
                key={id}
                className={`flex items-center rounded-lg border text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Checkbox button to toggle criteria on/off */}
                <button
                  onClick={() => toggleCriterion(id)}
                  className="px-2.5 py-1.5 flex items-center gap-1.5 border-r border-slate-800/80 hover:bg-slate-800/50"
                  title={isActive ? `Tier ${activeIndex + 1} active. Click to remove.` : 'Click to add as priority tie-breaker'}
                >
                  {isActive ? (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                      {activeIndex + 1}
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-600 inline-block" />
                  )}
                  <span>{label}</span>
                </button>

                {/* Asc/Desc toggle for this specific criterion */}
                {isActive && (
                  <button
                    onClick={() => toggleOrder(id)}
                    className="px-2 py-1.5 text-[10px] font-bold uppercase text-indigo-300 hover:text-indigo-100 hover:bg-indigo-900/50"
                    title={`Click to switch between ASC and DESC for ${id}`}
                  >
                    {currentOrder}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Playback Controls & Dashboard */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStepIndex(0)}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-200 transition"
                title="Reset to initial step"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-200 transition"
                title="Step backward"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition shadow-md ${
                  isPlaying 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isPlaying ? 'Pause Execution' : 'Run Merge Sort'}
              </button>

              <button
                onClick={() => setCurrentStepIndex((prev) => Math.min(history.length - 1, prev + 1))}
                disabled={currentStepIndex >= history.length - 1}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-200 transition"
                title="Step forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

              <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
                <span>Speed:</span>
                <input
                  type="range"
                  min="150"
                  max="1500"
                  step="50"
                  value={1650 - playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(1650 - Number(e.target.value))}
                  className="w-20 sm:w-28 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Test Boundary Presets */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Presets:</span>
              <button
                onClick={() => handlePreset('standard')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
              >
                8-Item Normal
              </button>
              <button
                onClick={() => handlePreset('reverse')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
              >
                Reverse (Worst)
              </button>
              <button
                onClick={() => handlePreset('duplicates')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
              >
                Duplicates (Multi-Tie Test)
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-2 transition-all duration-200"
              style={{
                width: `${history.length > 0 ? ((currentStepIndex + 1) / history.length) * 100 : 0}%`
              }}
            />
          </div>

          {/* Operational Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Step</p>
                <p className="text-sm font-semibold text-slate-100">{currentStepIndex + 1} / {history.length}</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Current Phase</p>
                <p className="text-sm font-semibold text-purple-300 uppercase">{currentStep.type || 'IDLE'}</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Comparisons</p>
                <p className="text-sm font-semibold text-amber-300">{currentStep.comparisons || 0}</p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Active Priority</p>
                <p className="text-xs font-semibold text-emerald-300 truncate">
                  {sortCriteria.map(c => c.key).join(' → ')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Log Banner */}
          <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-3 flex items-start gap-3">
            <Zap className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {currentStep.description}
            </p>
          </div>
        </section>

        {/* Auxiliary Merge Buffers Workspace */}
        {(currentStep.leftBuf?.length > 0 || currentStep.rightBuf?.length > 0) && (
          <section className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Auxiliary Merge Buffer Memory (O(n) Scratch Space)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Two-Finger Pointers: Left [i={currentStep.i ?? '-'}] vs Right [j={currentStep.j ?? '-'}]
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Buffer */}
              <div className="bg-slate-950/70 border border-blue-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Left Buffer [L]
                  </span>
                  <span className="text-[10px] text-slate-400">Pointer: i</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentStep.leftBuf.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded-lg border text-xs flex flex-col min-w-[130px] transition-all ${
                        currentStep.i === idx
                          ? 'border-blue-400 bg-blue-950/60 ring-2 ring-blue-400/50 scale-105'
                          : idx < (currentStep.i ?? 0)
                          ? 'border-slate-800 bg-slate-900/40 opacity-30 line-through'
                          : 'border-slate-800 bg-slate-900'
                      }`}
                    >
                      <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                      <div className="flex items-center gap-2 text-[11px] font-mono mt-1 text-slate-300">
                        <span>${item.price}</span>
                        <span>★ {item.rating}</span>
                        <span className="text-slate-400">({item.reviews})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Buffer */}
              <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Right Buffer [R]
                  </span>
                  <span className="text-[10px] text-slate-400">Pointer: j</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentStep.rightBuf.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded-lg border text-xs flex flex-col min-w-[130px] transition-all ${
                        currentStep.j === idx
                          ? 'border-purple-400 bg-purple-950/60 ring-2 ring-purple-400/50 scale-105'
                          : idx < (currentStep.j ?? 0)
                          ? 'border-slate-800 bg-slate-900/40 opacity-30 line-through'
                          : 'border-slate-800 bg-slate-900'
                      }`}
                    >
                      <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                      <div className="flex items-center gap-2 text-[11px] font-mono mt-1 text-slate-300">
                        <span>${item.price}</span>
                        <span>★ {item.rating}</span>
                        <span className="text-slate-400">({item.reviews})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Live Product Array Grid */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              Main Catalog Array Status (In-Place Memory View)
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Target Write Pointer (k)
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block" /> Midpoint (m)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {currentStep.array.map((prod, index) => {
              const highlightClass = getCardHighlightClass(index);
              const isTargetK = currentStep.k === index;
              const isMid = currentStep.mid === index;

              return (
                <div
                  key={prod.id}
                  className={`relative rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between ${highlightClass}`}
                >
                  <div className="absolute -top-3 left-3 flex gap-1 z-10">
                    <span className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                      idx: {index}
                    </span>
                    {isTargetK && (
                      <span className="bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] animate-pulse">
                        k
                      </span>
                    )}
                    {isMid && (
                      <span className="bg-purple-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                        mid
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mt-1 mb-2">
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                        {prod.category}
                      </span>
                      {prod.badge && (
                        <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                          {prod.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100 line-clamp-2 mb-2">
                      {prod.name}
                    </h4>

                    <div className="flex items-center gap-1 text-amber-400 text-xs mb-3">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold">{prod.rating}</span>
                      <span className="text-slate-400 text-[11px]">({prod.reviews} reviews)</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Price</span>
                      <span className="text-base font-bold text-slate-100">${prod.price}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                      {prod.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Complexity Summary */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-200">Merge Sort Multi-Criteria Invariant</h4>
              <p className="text-xs text-slate-400">
                Time: <span className="font-mono text-indigo-300">Θ(n log n)</span> | Auxiliary Space: <span className="font-mono text-indigo-300">O(n)</span> | Stability: <span className="text-emerald-400 font-semibold">Strictly Preserved Across All Tiers</span>
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            T(n) = 2T(n/2) + Θ(n)
          </div>
        </section>

      </main>
    </div>
  );
}