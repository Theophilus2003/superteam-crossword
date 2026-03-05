import { useState, useEffect, useRef, useCallback } from "react";

// ── PUZZLE DATA ─────────────────────────────────────────────────────────────
const WORDS = [
  { id: 1,  word: "SOLANA",     clue: "High-speed L1 blockchain, home of Superteam",        def: "Solana is a high-performance blockchain supporting 65k+ TPS using Proof of History consensus. Founded by Anatoly Yakovenko in 2017." },
  { id: 2,  word: "SUPERTEAM",  clue: "Global community of Web3 builders & operators",       def: "Superteam is a talent community that connects the best Web3 talent with Solana projects through bounties, grants, and jobs." },
  { id: 3,  word: "WALLET",     clue: "Phantom is one — stores your keys & tokens",           def: "A crypto wallet stores private keys. Phantom is the leading Solana wallet with 10M+ users." },
  { id: 4,  word: "WAGMI",      clue: "Web3 rallying cry: We're All Gonna Make It",           def: "WAGMI is a crypto expression of optimism and solidarity. Opposite: NGMI (Not Gonna Make It)." },
  { id: 5,  word: "AIRDROP",    clue: "Free tokens sent to early community members",          def: "An airdrop distributes free tokens to wallet addresses, rewarding early adopters or community participants." },
  { id: 6,  word: "BOUNTY",     clue: "Superteam Earn task with a prize for best work",       def: "On Superteam Earn, Bounties are open competitions where anyone can submit work and winners receive USDC prizes." },
  { id: 7,  word: "VALIDATOR",  clue: "Node that confirms Solana transactions for rewards",   def: "A Solana validator processes transactions and participates in consensus, earning SOL staking rewards." },
  { id: 8,  word: "LAMPORT",    clue: "Smallest unit of SOL (0.000000001)",                   def: "A Lamport is the smallest unit of SOL, named after computer scientist Leslie Lamport." },
  { id: 9,  word: "DEPIN",      clue: "Decentralized Physical Infrastructure Networks",       def: "DePIN leverages blockchain incentives to build real-world infrastructure like wireless networks and storage." },
  { id: 10, word: "EARN",       clue: "Superteam's platform for bounties & grants",           def: "Superteam Earn is the platform where Web3 companies post bounties and freelance projects for the community." },
  { id: 11, word: "STAKE",      clue: "Lock SOL with a validator to earn yield",              def: "Staking on Solana means delegating SOL to a validator. In return, stakers earn a portion of block rewards." },
  { id: 12, word: "NFT",        clue: "Non-Fungible Token — digital ownership on-chain",      def: "An NFT is a unique blockchain-based digital asset representing ownership of art, collectibles, or in-game items." },
  { id: 13, word: "DAO",        clue: "Decentralized Autonomous Organization",                def: "A DAO is an organization governed by smart contracts and token-holder votes rather than traditional management." },
  { id: 14, word: "GRANT",      clue: "Funding given to builders by Superteam/Solana Fdn",   def: "Grants are non-dilutive funding awarded to builders creating valuable projects in the Solana ecosystem." },
  { id: 15, word: "ANATOLY",    clue: "Co-founder of Solana (first name)",                    def: "Anatoly Yakovenko is the co-founder and CEO of Solana Labs, inventor of Proof of History." },
];

// Pre-solved crossword layout: {wordId, row, col, dir}
// dir: 'across' | 'down'
const LAYOUT = [
  { wordId: 1,  row: 0,  col: 2,  dir: "across" },  // SOLANA       (6)
  { wordId: 2,  row: 0,  col: 7,  dir: "down"   },  // SUPERTEAM    (9)
  { wordId: 3,  row: 4,  col: 2,  dir: "across" },  // WALLET       (6)
  { wordId: 4,  row: 8,  col: 0,  dir: "across" },  // WAGMI        (5)
  { wordId: 5,  row: 2,  col: 0,  dir: "across" },  // AIRDROP      (7)
  { wordId: 6,  row: 6,  col: 2,  dir: "across" },  // BOUNTY       (6)
  { wordId: 7,  row: 1,  col: 4,  dir: "down"   },  // VALIDATOR    (9)
  { wordId: 8,  row: 10, col: 1,  dir: "across" },  // LAMPORT      (7)
  { wordId: 9,  row: 12, col: 3,  dir: "across" },  // DEPIN        (5)
  { wordId: 10, row: 2,  col: 7,  dir: "down"   },  // EARN         (4)
  { wordId: 11, row: 0,  col: 2,  dir: "down"   },  // STAKE        (5)
  { wordId: 12, row: 4,  col: 8,  dir: "across" },  // NFT          (3)
  { wordId: 13, row: 8,  col: 6,  dir: "across" },  // DAO          (3)
  { wordId: 14, row: 6,  col: 7,  dir: "down"   },  // GRANT        (5)
  { wordId: 15, row: 10, col: 9,  dir: "down"   },  // ANATOLY      (7)
];

function buildAnswerGrid(layout, words) {
  const grid = {};
  layout.forEach(({ wordId, row, col, dir }) => {
    const word = words.find(w => w.id === wordId).word;
    for (let i = 0; i < word.length; i++) {
      const r = dir === "across" ? row : row + i;
      const c = dir === "across" ? col + i : col;
      grid[`${r},${c}`] = word[i];
    }
  });
  return grid;
}

const ANSWER_GRID = buildAnswerGrid(LAYOUT, WORDS);
const GRID_ROWS = 17;
const GRID_COLS = 17;

// Derive which cells belong to each layout entry
function getWordCells(entry, words) {
  const word = words.find(w => w.id === entry.wordId).word;
  return Array.from({ length: word.length }, (_, i) => ({
    r: entry.dir === "across" ? entry.row : entry.row + i,
    c: entry.dir === "across" ? entry.col + i : entry.col,
    letter: word[i],
  }));
}

// ── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#06060f",
  card: "#0d0d1f",
  border: "#1a1a35",
  purple: "#9945FF",
  green: "#14F195",
  gold: "#FFD700",
  dim: "#4a4a80",
  text: "#e0e0ff",
  tileBase: "#111128",
  tileActive: "#1a1040",
};

// ── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: C.bg,
    color: C.text,
    fontFamily: "'Space Mono', monospace",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 24px",
    borderBottom: `1px solid ${C.border}`,
    background: "rgba(10,10,25,0.9)",
    backdropFilter: "blur(12px)",
    zIndex: 50,
    flexShrink: 0,
  },
  logoMark: {
    width: 34, height: 34,
    borderRadius: 8,
    background: `linear-gradient(135deg, ${C.purple}, ${C.green})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 17, marginRight: 10, flexShrink: 0,
  },
  logoText: {
    fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.06em",
    background: `linear-gradient(90deg, ${C.purple}, ${C.green})`,
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  logoSub: { fontSize: "0.55rem", color: C.dim, letterSpacing: "0.2em", marginTop: 1 },
  pill: (color) => ({
    fontSize: "0.65rem", letterSpacing: "0.1em",
    border: `1px solid ${color}40`, borderRadius: 20,
    padding: "5px 12px", background: `${color}0d`, color,
  }),
  main: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "260px 1fr 260px",
    gap: 0,
    overflow: "hidden",
    height: "calc(100vh - 57px)",
  },
  panel: {
    background: C.card,
    borderRight: `1px solid ${C.border}`,
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  panelRight: {
    background: C.card,
    borderLeft: `1px solid ${C.border}`,
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "14px 16px 10px",
    fontSize: "0.6rem", letterSpacing: "0.2em", color: C.dim,
    borderBottom: `1px solid ${C.border}`,
    textTransform: "uppercase", flexShrink: 0,
  },
  panelScroll: { flex: 1, overflowY: "auto", padding: "10px 12px" },
  gridArea: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", padding: 20, gap: 14,
    background: C.bg,
    position: "relative",
  },
  timerBox: {
    fontSize: "1.6rem", fontWeight: 700, letterSpacing: "0.12em",
    background: `linear-gradient(90deg, ${C.purple}, ${C.green})`,
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
};

// ── WORD TILE (in tray) ───────────────────────────────────────────────────────
function WordTile({ wordObj, isPlaced, isSelected, isRotated, onClick }) {
  const letters = wordObj.word.split("");
  const bg = isPlaced
    ? `${C.green}18`
    : isSelected
    ? `${C.purple}28`
    : C.tileBase;
  const borderColor = isPlaced ? C.green : isSelected ? C.purple : C.border;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: isRotated ? "column" : "row",
        alignItems: "center",
        gap: 3,
        padding: "8px 10px",
        borderRadius: 10,
        border: `1px solid ${borderColor}`,
        background: bg,
        cursor: isPlaced ? "default" : "pointer",
        marginBottom: 6,
        transition: "all 0.2s",
        opacity: isPlaced ? 0.45 : 1,
        boxShadow: isSelected ? `0 0 14px ${C.purple}55` : "none",
        userSelect: "none",
      }}
    >
      {letters.map((l, i) => (
        <div
          key={i}
          style={{
            width: 22, height: 22,
            background: isPlaced ? `${C.green}20` : isSelected ? `${C.purple}30` : "#1a1a38",
            border: `1px solid ${isPlaced ? C.green + "40" : isSelected ? C.purple + "50" : C.border}`,
            borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.65rem", fontWeight: 700,
            color: isPlaced ? C.green : isSelected ? "#fff" : C.text,
            flexShrink: 0,
          }}
        >
          {l}
        </div>
      ))}
      {!isPlaced && (
        <div style={{ marginLeft: isRotated ? 0 : 6, marginTop: isRotated ? 6 : 0, fontSize: "0.55rem", color: C.dim, whiteSpace: "nowrap" }}>
          {isRotated ? "↕" : "↔"}
        </div>
      )}
    </div>
  );
}

// ── CROSSWORD GRID ────────────────────────────────────────────────────────────
function CrosswordGrid({ layout, words, placedWords, selectedWordId, hoveredCell, onCellClick, onCellHover, CELL }) {
  // Build display grid
  const displayGrid = {};
  // Show answer letters for placed words
  layout.forEach(entry => {
    if (!placedWords.has(entry.wordId)) return;
    getWordCells(entry, words).forEach(({ r, c, letter }) => {
      displayGrid[`${r},${c}`] = { letter, wordId: entry.wordId, placed: true };
    });
  });

  // Find cells belonging to selected word (for preview)
  const selectedEntry = selectedWordId ? layout.find(e => e.wordId === selectedWordId) : null;
  const selectedCells = new Set();
  if (selectedEntry) {
    getWordCells(selectedEntry, words).forEach(({ r, c }) => selectedCells.add(`${r},${c}`));
  }

  // Find valid placement cells for selected word (intersections already placed)
  const validDropCells = new Set();
  if (selectedEntry) {
    getWordCells(selectedEntry, words).forEach(({ r, c }) => validDropCells.add(`${r},${c}`));
  }

  // All occupied cells in answer
  const answerCells = new Set(Object.keys(ANSWER_GRID));

  const rows = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const cols = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const key = `${r},${c}`;
      const isAnswerCell = answerCells.has(key);
      const cellData = displayGrid[key];
      const isSelected = selectedCells.has(key);
      const isHovered = hoveredCell === key;

      if (!isAnswerCell) {
        cols.push(
          <div key={key} style={{ width: CELL, height: CELL, background: "transparent" }} />
        );
        continue;
      }

      const placed = cellData?.placed;
      let bg = "#0e0e22";
      let borderCol = "#1e1e38";
      let textCol = C.dim;
      if (placed) { bg = `${C.green}18`; borderCol = `${C.green}55`; textCol = C.green; }
      if (isSelected && !placed) { bg = `${C.purple}22`; borderCol = `${C.purple}88`; }
      if (isHovered && !placed) { bg = `${C.purple}35`; borderCol = C.purple; }

      cols.push(
        <div
          key={key}
          onClick={() => isAnswerCell && onCellClick && onCellClick(r, c)}
          onMouseEnter={() => onCellHover && onCellHover(key)}
          onMouseLeave={() => onCellHover && onCellHover(null)}
          style={{
            width: CELL, height: CELL,
            background: bg,
            border: `1px solid ${borderCol}`,
            borderRadius: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: CELL * 0.38, fontWeight: 700,
            color: textCol,
            cursor: selectedWordId && !placed ? "pointer" : "default",
            transition: "all 0.15s",
            boxShadow: placed ? `inset 0 0 8px ${C.green}22` : isSelected ? `inset 0 0 8px ${C.purple}33` : "none",
            userSelect: "none",
          }}
        >
          {placed ? cellData.letter : ""}
        </div>
      );
    }
    rows.push(
      <div key={r} style={{ display: "flex", gap: 2 }}>{cols}</div>
    );
  }
  return <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{rows}</div>;
}

// ── LEADERBOARD DATA ─────────────────────────────────────────────────────────
const LB = [
  { name: "anatoly.sol",    emoji: "🦊", score: 980, time: "03:42", rank: 1 },
  { name: "raj_gokal",      emoji: "🌟", score: 920, time: "04:15", rank: 2 },
  { name: "superteam.sol",  emoji: "⚡", score: 870, time: "05:01", rank: 3 },
  { name: "armani.sol",     emoji: "🔥", score: 810, time: "06:33", rank: 4 },
  { name: "kash.sol",       emoji: "🚀", score: 760, time: "07:22", rank: 5 },
];

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [placedWords, setPlacedWords] = useState(new Set());
  const [selectedWordId, setSelectedWordId] = useState(null);
  const [rotatedWords, setRotatedWords] = useState(new Set(
    LAYOUT.filter(e => e.dir === "down").map(e => e.wordId)
  ));
  const [hoveredCell, setHoveredCell] = useState(null);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [defPopup, setDefPopup] = useState(null); // {word, def}
  const [wrongFlash, setWrongFlash] = useState(null);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [showHelp, setShowHelp] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  // Cell size responsive
  const [CELL, setCell] = useState(30);
  useEffect(() => {
    function resize() {
      const availW = window.innerWidth - 520 - 80;
      const availH = window.innerHeight - 57 - 120;
      const byW = Math.floor(availW / (GRID_COLS + 1));
      const byH = Math.floor(availH / (GRID_ROWS + 1));
      setCell(Math.max(20, Math.min(34, byW, byH)));
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Timer
  useEffect(() => {
    if (gameWon) return;
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [gameWon]);

  const timeStr = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  // Select a word tile
  function selectWord(id) {
    if (placedWords.has(id)) return;
    setSelectedWordId(prev => prev === id ? null : id);
  }

  // Rotate selected word
  function rotateSelected() {
    if (!selectedWordId) return;
    setRotatedWords(prev => {
      const next = new Set(prev);
      next.has(selectedWordId) ? next.delete(selectedWordId) : next.add(selectedWordId);
      return next;
    });
  }

  // Place word on grid click
  function onCellClick(r, c) {
    if (!selectedWordId) return;
    const entry = LAYOUT.find(e => e.wordId === selectedWordId);
    if (!entry) return;

    // Check if direction matches
    const isRotated = rotatedWords.has(selectedWordId);
    const expectedDir = isRotated ? "down" : "across";
    if (entry.dir !== expectedDir) {
      // Wrong rotation
      setWrongFlash(selectedWordId);
      setTimeout(() => setWrongFlash(null), 700);
      return;
    }

    // Check if starting cell matches
    if (r === entry.row && c === entry.col) {
      // Place it!
      setPlacedWords(prev => {
        const next = new Set(prev);
        next.add(selectedWordId);
        return next;
      });
      const pts = 100 + Math.max(0, 60 - seconds);
      setScore(s => s + pts);
      setSelectedWordId(null);

      // Show definition
      const w = WORDS.find(w => w.id === selectedWordId);
      setDefPopup({ word: w.word, def: w.def });
      setTimeout(() => setDefPopup(null), 5000);

      // Check win
      const newPlaced = new Set(placedWords);
      newPlaced.add(selectedWordId);
      if (newPlaced.size === LAYOUT.length) {
        clearInterval(timerRef.current);
        setTimeout(() => setGameWon(true), 600);
      }
    } else {
      setWrongFlash(selectedWordId);
      setTimeout(() => setWrongFlash(null), 700);
    }
  }

  function useHint() {
    if (hintsLeft <= 0) return;
    // Find first unplaced word and reveal it
    const unplaced = LAYOUT.filter(e => !placedWords.has(e.wordId));
    if (!unplaced.length) return;
    const pick = unplaced[Math.floor(Math.random() * unplaced.length)];
    // Auto-set correct rotation
    setRotatedWords(prev => {
      const next = new Set(prev);
      pick.dir === "down" ? next.add(pick.wordId) : next.delete(pick.wordId);
      return next;
    });
    setSelectedWordId(pick.wordId);
    setHintsLeft(h => h - 1);
    setScore(s => Math.max(0, s - 50));
  }

  const rankEmoji = ["🥇","🥈","🥉"];
  const solvedCount = placedWords.size;
  const totalCount = LAYOUT.length;
  const progress = totalCount > 0 ? (solvedCount / totalCount) * 100 : 0;

  // Word list grouped: unplaced first, placed at bottom
  const sortedWords = [...WORDS].sort((a, b) => {
    const ap = placedWords.has(a.id) ? 1 : 0;
    const bp = placedWords.has(b.id) ? 1 : 0;
    return ap - bp;
  });

  return (
    <div style={S.app}>
      {/* BG grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(${C.purple}08 1px, transparent 1px), linear-gradient(90deg, ${C.purple}08 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />
      {/* Orbs */}
      <div style={{ position:"fixed", width:400,height:400,borderRadius:"50%",background:C.purple,filter:"blur(90px)",opacity:0.08,top:-100,left:-100,pointerEvents:"none",zIndex:0 }}/>
      <div style={{ position:"fixed", width:300,height:300,borderRadius:"50%",background:C.green,filter:"blur(90px)",opacity:0.07,bottom:0,right:0,pointerEvents:"none",zIndex:0 }}/>

      {/* HEADER */}
      <header style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:0 }}>
          <div style={S.logoMark}>⚡</div>
          <div style={{ marginLeft: 10 }}>
            <div style={S.logoText}>SUPERTEAM CROSSWORD</div>
            <div style={S.logoSub}>WEB3 DAILY PUZZLE · #042</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={S.pill(C.green)}>{new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}).toUpperCase()}</div>
          <div style={S.pill(C.gold)}>⭐ {score} PTS</div>
          <div style={S.pill(C.purple)}>{timeStr}</div>
          <button onClick={() => setShowHelp(true)} style={{ background:"transparent",border:`1px solid ${C.border}`,color:C.dim,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:"0.7rem" }}>?</button>
        </div>
      </header>

      {/* MAIN 3-COLUMN */}
      <div style={S.main}>

        {/* LEFT: WORD TRAY */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            📦 Word Bank — {solvedCount}/{totalCount} placed
            <div style={{ marginTop: 8, height: 4, background: C.border, borderRadius: 2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${C.purple},${C.green})`, transition:"width 0.5s", borderRadius:2 }}/>
            </div>
          </div>
          <div style={{ ...S.panelScroll, paddingBottom: 20 }}>
            {sortedWords.map(w => {
              const isWrong = wrongFlash === w.id;
              return (
                <div key={w.id} style={{
                  transform: isWrong ? "translateX(4px)" : "none",
                  transition: "transform 0.1s",
                }}>
                  <WordTile
                    wordObj={w}
                    isPlaced={placedWords.has(w.id)}
                    isSelected={selectedWordId === w.id}
                    isRotated={rotatedWords.has(w.id)}
                    onClick={() => selectWord(w.id)}
                  />
                  {selectedWordId === w.id && (
                    <div style={{ fontSize:"0.65rem", color:C.dim, paddingLeft:10, marginBottom:6, lineHeight:1.5 }}>
                      {w.clue}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div style={{ padding:"12px", borderTop:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
            <button
              onClick={rotateSelected}
              disabled={!selectedWordId}
              style={{
                padding:"9px", borderRadius:9, fontFamily:"'Space Mono',monospace",
                fontSize:"0.65rem", letterSpacing:"0.1em", textTransform:"uppercase",
                cursor: selectedWordId ? "pointer" : "not-allowed",
                background: selectedWordId ? `${C.purple}20` : "transparent",
                border:`1px solid ${selectedWordId ? C.purple : C.border}`,
                color: selectedWordId ? C.purple : C.dim,
                transition:"all 0.2s",
              }}
            >
              🔄 Rotate Word {selectedWordId ? (rotatedWords.has(selectedWordId) ? "(↕ DOWN)" : "(↔ ACROSS)") : ""}
            </button>
            <button
              onClick={useHint}
              disabled={hintsLeft === 0}
              style={{
                padding:"9px", borderRadius:9, fontFamily:"'Space Mono',monospace",
                fontSize:"0.65rem", letterSpacing:"0.1em", textTransform:"uppercase",
                cursor: hintsLeft > 0 ? "pointer" : "not-allowed",
                background: `${C.gold}12`, border:`1px solid ${C.gold}40`,
                color: hintsLeft > 0 ? C.gold : C.dim, transition:"all 0.2s",
              }}
            >
              💡 Hint (−50 pts) · {hintsLeft} left
            </button>
          </div>
        </div>

        {/* CENTER: GRID */}
        <div style={S.gridArea} ref={containerRef}>
          <div style={{ position:"relative", zIndex:5 }}>
            {selectedWordId && (
              <div style={{
                marginBottom:10, textAlign:"center",
                fontSize:"0.65rem", letterSpacing:"0.12em", color:C.purple,
                background:`${C.purple}15`, border:`1px solid ${C.purple}40`,
                borderRadius:8, padding:"6px 16px",
              }}>
                {rotatedWords.has(selectedWordId) ? "↕ VERTICAL — " : "↔ HORIZONTAL — "}
                Click the correct starting cell to place &nbsp;
                <strong style={{color:"#fff"}}>{WORDS.find(w=>w.id===selectedWordId)?.word}</strong>
              </div>
            )}
            <CrosswordGrid
              layout={LAYOUT}
              words={WORDS}
              placedWords={placedWords}
              selectedWordId={selectedWordId}
              hoveredCell={hoveredCell}
              onCellClick={onCellClick}
              onCellHover={setHoveredCell}
              CELL={CELL}
            />
          </div>

          {/* DEF POPUP */}
          {defPopup && (
            <div style={{
              position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)",
              background:C.card, border:`1px solid ${C.green}`,
              borderRadius:14, padding:"16px 22px", maxWidth:380, width:"90%",
              boxShadow:`0 0 24px ${C.green}40, 0 20px 50px #00000088`,
              zIndex:30, animation:"none",
            }}>
              <div style={{
                fontSize:"1.1rem", fontWeight:700,
                background:`linear-gradient(90deg,${C.purple},${C.green})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                marginBottom:6,
              }}>{defPopup.word} ✓</div>
              <div style={{ fontSize:"0.75rem", color:C.dim, lineHeight:1.6 }}>{defPopup.def}</div>
              <button onClick={()=>setDefPopup(null)} style={{ position:"absolute",top:8,right:10,background:"none",border:"none",color:C.dim,fontSize:16,cursor:"pointer" }}>×</button>
            </div>
          )}
        </div>

        {/* RIGHT: LEADERBOARD + CLUES */}
        <div style={S.panelRight}>
          <div style={S.panelHeader}>🏆 Leaderboard</div>
          <div style={{ padding:"10px 12px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            {LB.map((e, i) => (
              <div key={e.name} style={{
                display:"flex", alignItems:"center", gap:10, padding:"8px 8px",
                borderRadius:8, marginBottom:4,
                background: i < 3 ? `${[C.gold,C.text,"#cd7f32"][i]}08` : "transparent",
                border:`1px solid ${i < 3 ? [C.gold,C.dim,"#cd7f32"][i]+"30" : "transparent"}`,
              }}>
                <span style={{ fontSize:"1rem", minWidth:22 }}>{rankEmoji[i] || `#${i+1}`}</span>
                <span style={{ fontSize:"1.2rem" }}>{e.emoji}</span>
                <span style={{ flex:1, fontSize:"0.72rem", fontWeight:600 }}>{e.name}</span>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"0.72rem", color:C.gold, fontWeight:700 }}>{e.score}</div>
                  <div style={{ fontSize:"0.6rem", color:C.dim }}>{e.time}</div>
                </div>
              </div>
            ))}
            {/* You */}
            <div style={{
              display:"flex", alignItems:"center", gap:10, padding:"8px 8px",
              borderRadius:8, background:`${C.green}0d`, border:`1px solid ${C.green}35`,
            }}>
              <span style={{ fontSize:"0.8rem", minWidth:22, color:C.dim }}>YOU</span>
              <span style={{ fontSize:"1.2rem" }}>👾</span>
              <span style={{ flex:1, fontSize:"0.72rem", fontWeight:600, color:C.green }}>you.sol</span>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"0.72rem", color:C.gold, fontWeight:700 }}>{score}</div>
                <div style={{ fontSize:"0.6rem", color:C.dim }}>{timeStr}</div>
              </div>
            </div>
          </div>

          {/* Active clue */}
          <div style={S.panelHeader}>📖 Clues</div>
          <div style={S.panelScroll}>
            {WORDS.map(w => {
              const entry = LAYOUT.find(e => e.wordId === w.id);
              const placed = placedWords.has(w.id);
              const selected = selectedWordId === w.id;
              return (
                <div
                  key={w.id}
                  onClick={() => !placed && selectWord(w.id)}
                  style={{
                    display:"flex", gap:10, padding:"8px 10px",
                    borderRadius:8, marginBottom:4, cursor: placed ? "default" : "pointer",
                    background: selected ? `${C.purple}18` : placed ? `${C.green}0a` : "transparent",
                    border:`1px solid ${selected ? C.purple : placed ? C.green+"30" : "transparent"}`,
                    opacity: placed ? 0.5 : 1,
                    transition:"all 0.2s",
                  }}
                >
                  <div style={{ minWidth:18, fontSize:"0.65rem", color: placed ? C.green : C.purple, fontWeight:700, paddingTop:1 }}>
                    {placed ? "✓" : entry?.dir === "across" ? "→" : "↓"}
                  </div>
                  <div>
                    <div style={{ fontSize:"0.72rem", fontWeight:700, color: placed ? C.green : "#fff", marginBottom:2 }}>{w.word}</div>
                    <div style={{ fontSize:"0.68rem", color:C.dim, lineHeight:1.4 }}>{w.clue}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* WIN MODAL */}
      {gameWon && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.88)",
          zIndex:200, display:"flex", alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(10px)",
        }}>
          <div style={{
            background:C.card, border:`1px solid ${C.green}`,
            borderRadius:24, padding:"44px 50px", textAlign:"center",
            maxWidth:420, boxShadow:`0 0 40px ${C.green}40, 0 40px 80px #000000aa`,
          }}>
            <div style={{ fontSize:"3rem", marginBottom:12 }}>🎉</div>
            <div style={{
              fontSize:"2.2rem", fontWeight:800, marginBottom:8,
              background:`linear-gradient(90deg,${C.purple},${C.green})`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>WAGMI!</div>
            <div style={{ fontSize:"0.85rem", color:C.dim, marginBottom:28 }}>You solved the Superteam Web3 Crossword!</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:28 }}>
              {[["⏱", timeStr, "Time"], ["⭐", score, "Score"], ["💡", 3 - hintsLeft, "Hints Used"]].map(([icon, val, lbl]) => (
                <div key={lbl} style={{ background:`${C.purple}15`, border:`1px solid ${C.purple}40`, borderRadius:12, padding:"14px 8px" }}>
                  <div style={{ fontSize:"1.3rem" }}>{icon}</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"1.1rem", fontWeight:700, color:C.green }}>{val}</div>
                  <div style={{ fontSize:"0.6rem", color:C.dim, marginTop:2, textTransform:"uppercase", letterSpacing:"0.1em" }}>{lbl}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setGameWon(false)}
              style={{
                width:"100%", padding:14, borderRadius:12,
                background:`linear-gradient(135deg,${C.purple},#7b2fff)`,
                border:`1px solid ${C.purple}`, color:"#fff",
                fontFamily:"'Space Mono',monospace", fontSize:"0.75rem",
                letterSpacing:"0.1em", cursor:"pointer",
                boxShadow:`0 0 20px ${C.purple}55`,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelp && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
          zIndex:200, display:"flex", alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(8px)",
        }} onClick={() => setShowHelp(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:C.card, border:`1px solid ${C.border}`,
              borderRadius:20, padding:"36px 40px", maxWidth:400, width:"90%",
            }}
          >
            <div style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:18, background:`linear-gradient(90deg,${C.purple},${C.green})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              How to Play
            </div>
            {[
              ["1️⃣", "Pick a word from the Word Bank (left panel)"],
              ["2️⃣", "Use 🔄 Rotate to flip it horizontal ↔ or vertical ↕"],
              ["3️⃣", "Click the correct starting cell on the grid to place it"],
              ["4️⃣", "Read the clue or check the Clues panel for hints"],
              ["💡", "Use Hints to auto-select the right word & rotation (−50 pts)"],
              ["✓",  "Words light up green when placed correctly!"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display:"flex", gap:12, marginBottom:12, fontSize:"0.78rem", color:C.dim, alignItems:"flex-start" }}>
                <span style={{ fontSize:"1rem", flexShrink:0 }}>{icon}</span>
                <span style={{ lineHeight:1.5 }}>{text}</span>
              </div>
            ))}
            <button
              onClick={() => setShowHelp(false)}
              style={{
                marginTop:10, width:"100%", padding:12, borderRadius:10,
                background:`${C.purple}20`, border:`1px solid ${C.purple}`,
                color:C.purple, fontFamily:"'Space Mono',monospace",
                fontSize:"0.7rem", letterSpacing:"0.1em", cursor:"pointer",
              }}
            >
              Let's Go ⚡
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a50; border-radius: 2px; }
      `}</style>
    </div>
  );
}
