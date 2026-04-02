let unlockedLevel = parseInt(localStorage.getItem('ws_elite_unlocked')) || 1;
let activeLvl = 1, score = 0, timer = 0, timerInt = null, foundWords = [];
let sfxEnabled = true, chapterPage = 0;

const FACTS = [
    "The dot over an 'i' or 'j' is called a tittle.",
    "Shakespeare invented the word 'swagger'.",
    "'Dreamt' is the only English word ending in 'mt'.",
    "Octopuses have three hearts and blue blood.",
    "Bananas are technically berries, but strawberries aren't.",
    "Honey never spoils; archaeologists found edible 3000-year-old honey.",
    "A day on Venus is longer than its entire year.",
    "The word 'set' has the most definitions in the English language.",
    "Turtles can breathe through their butts during hibernation.",
    "A 'jiffy' is an actual unit of time: 1/100th of a second.",
    "A group of crows is famously called a 'murder'.",
    "The letter 'E' is the most commonly used letter in English.",
    "Snails can sleep for up to three years at a time.",
    "The word 'muscle' comes from Latin for 'little mouse'.",
    "Noon originally meant 3:00 PM in ancient Rome.",
    "A single cloud can weigh more than a million pounds.",
    "The word 'quiz' was invented as a bet to create a new word.",
    "The hashtag symbol (#) is technically called an octothorpe.",
    "The word 'robot' comes from a Czech word meaning forced labor.",
    "Maine is the only US state with a one-syllable name.",
    "Typewriter is the longest word using only the top row of keys.",
    "An 'ambigram' is a word that looks the same upside down.",
    "The word 'nerd' was first coined by Dr. Seuss in 1950.",
    "The word 'goodbye' is a contraction of 'God be with ye'.",
    "The infinity symbol is technically called a lemniscate.",
    "The space between your eyebrows is called the glabella.",
    "A crocodile cannot stick its tongue out of its mouth.",
    "Sloths can hold their breath longer than dolphins can.",
    "The word 'shampoo' comes from a Hindi word for massage.",
    "The word 'salary' comes from the Latin word for salt.",
    "The word 'gymnasium' means 'school for naked exercise' in Greek.",
    "Water makes a different sound when it is hot vs cold.",
    "The symbol & was once the 27th letter of the alphabet.",
    "The word 'Checkmate' comes from Persian 'Shah Mat' (The King is dead).",
    "A 'pangram' sentence uses every letter of the alphabet.",
    "'Rhythm' is the longest English word without a real vowel.",
    "The longest word in English has 189,819 letters.",
    "The shortest complete sentence is 'I am'.",
    "Cats have 32 muscles in each ear.",
    "Your brain uses about 20% of your total oxygen and calories.",
    "The heart of a shrimp is located in its head.",
    "Elephants are the only animals that cannot jump.",
    "A cow-bison hybrid is called a 'Beefalo'.",
    "The tongue is the strongest muscle in the human body.",
    "It is impossible to hum while holding your nose.",
    "The 'Twitter' bird actually has a name: Larry.",
    "The first orange was actually green.",
    "A small child could swim through the veins of a Blue Whale.",
    "A bolt of lightning is five times hotter than the sun.",
    "The moon has moonquakes just like Earth has earthquakes."
];

const WORD_POOL = ["ALGORITHM","BINARY","DATABASE","FIREWALL","GATEWAY","HARDWARE","ITERATE","KERNEL","LOGIC","NETWORK","PROTOCOL","RUNTIME","SERVER","TERMINAL","VARIABLE","AVALANCHE","BLIZZARD","CYCLONE","DROUGHT","EARTHQUAKE","HURRICANE","MONSOON","NEBULA","RAINBOW","VOLCANO","DIAMOND","EMERALD","SAPPHIRE","QUARTZ","OBSIDIAN","MARATHON","SURFING","TENNIS","VOLLEYBALL","CRICKET","ASTRONAUT","BIOLOGIST","ENGINEER","SCIENTIST","INVENTOR"];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// INTENSE ORGANIC SCREECHING SOUND (FM Synthesis)
function playScreech() {
    if(!sfxEnabled) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const carrier = audioCtx.createOscillator();
    const modulator = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    const mainGain = audioCtx.createGain();

    carrier.type = 'sawtooth';
    modulator.type = 'square';
    
    const baseFreq = 1100 + Math.random() * 600;
    carrier.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    modulator.frequency.setValueAtTime(baseFreq * 2.1, audioCtx.currentTime);
    
    modGain.gain.setValueAtTime(1200, audioCtx.currentTime);
    mainGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(mainGain);
    mainGain.connect(audioCtx.destination);

    carrier.start(); modulator.start();
    carrier.stop(audioCtx.currentTime + 0.05);
    modulator.stop(audioCtx.currentTime + 0.05);
}

function playPop() {
    if(!sfxEnabled) return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.frequency.setValueAtTime(600, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.1);
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.1);
}

function toggleSFX() { 
    sfxEnabled = !sfxEnabled; 
    document.getElementById('sfx-toggle').classList.toggle('on', sfxEnabled); 
}

function toggleSettings() { 
    const p = document.getElementById('settings-panel');
    p.classList.toggle('hidden-screen');
    if(!p.classList.contains('hidden-screen')) gsap.from(p.children[0], {scale: 0.9, opacity: 0, duration: 0.3});
}

function showMenu() { 
    hideAll(); 
    document.getElementById('main-menu').classList.remove('hidden-screen'); 
    clearInterval(timerInt); 
}

function hideAll() { 
    ['main-menu','level-screen','game-screen','win-modal','settings-panel'].forEach(id => {
        document.getElementById(id).classList.add('hidden-screen');
    });
}

// INSTANT LOAD CHAPTERS
function showChapters() {
    hideAll();
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    const maxPage = Math.floor((unlockedLevel - 1) / 100);
    const start = (chapterPage * 100) + 1, end = start + 99;
    document.getElementById('chapter-title').innerText = `Levels ${start}-${end}`;
    document.getElementById('next-page-btn').style.opacity = chapterPage < maxPage ? "1" : "0.2";

    const fragment = document.createDocumentFragment();
    for(let i = start; i <= end; i++) {
        const locked = i > unlockedLevel;
        const b = document.createElement('button');
        b.className = `aspect-square rounded-2xl font-black flex items-center justify-center transition-all ${locked ? 'bg-white/5 opacity-20' : 'glass hover:bg-indigo-500/30'}`;
        b.innerHTML = locked ? '<svg class="w-4 h-4 fill-white/40" viewBox="0 0 24 24"><path d="M18 10V7a6 6 0 1 0-12 0v3H4v10h16V10h-2zm-10 0V7a4 4 0 1 1 8 0v3H8z"/></svg>' : i;
        if(!locked) b.onclick = () => startLevel(i);
        fragment.appendChild(b);
    }
    grid.appendChild(fragment);
    document.getElementById('level-screen').classList.remove('hidden-screen');
    gsap.from('#level-grid', {opacity: 0, y: 10, duration: 0.2});
}

function nextChapterPage() { 
    if(chapterPage < Math.floor((unlockedLevel - 1) / 100)) { 
        chapterPage++; 
        showChapters(); 
    } 
}

function playContinue() { startLevel(unlockedLevel); }

function startLevel(n) {
    activeLvl = n; score = 0; foundWords = [];
    hideAll();
    document.getElementById('game-screen').classList.remove('hidden-screen');
    document.getElementById('lvl-badge').innerText = `Level ${n}`;
    const size = Math.min(15, 8 + Math.floor(n / 12));
    const count = Math.min(12, 4 + Math.floor(n / 6));
    const words = [];
    for(let i=0; i<count; i++) words.push(WORD_POOL[(n * 3 + i) % WORD_POOL.length]);
    generateGrid(size, words);
    startTimer();
}

function generateGrid(size, words) {
    const grid = Array(size).fill(0).map(() => Array(size).fill(''));
    const placed = [];
    const dirs = [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
    words.forEach(word => {
        let success = false, attempts = 0;
        while(!success && attempts < 50) {
            const dir = dirs[Math.floor(Math.random()*8)];
            const r = Math.floor(Math.random()*size), c = Math.floor(Math.random()*size);
            if(canPlace(grid, word, r, c, dir)) {
                for(let i=0; i<word.length; i++) grid[r + i*dir[0]][c + i*dir[1]] = word[i];
                placed.push(word); success = true;
            }
            attempts++;
        }
    });
    for(let r=0; r<size; r++) for(let c=0; c<size; c++) if(!grid[r][c]) grid[r][c] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random()*26)];
    renderGrid(grid, placed);
}

function canPlace(g, w, r, c, d) {
    for(let i=0; i<w.length; i++) {
        const nr = r+i*d[0], nc = c+i*d[1];
        if(nr<0 || nr>=g.length || nc<0 || nc>=g.length || (g[nr][nc]!=='' && g[nr][nc]!==w[i])) return false;
    }
    return true;
}

function renderGrid(g, words) {
    const box = document.getElementById('grid-box');
    box.innerHTML = `<svg id="selection-svg" class="absolute inset-0 w-full h-full pointer-events-none z-10"><line id="drag-line" stroke="rgba(99, 102, 241, 0.2)" stroke-width="24" stroke-linecap="round" visibility="hidden" /></svg>`;
    box.style.gridTemplateColumns = `repeat(${g.length}, 1fr)`;
    box.style.gridTemplateRows = `repeat(${g.length}, 1fr)`;
    g.forEach((row, r) => row.forEach((char, c) => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell'; cell.innerText = char;
        cell.dataset.r = r; cell.dataset.c = c;
        cell.onpointerdown = startDrag; cell.onpointerenter = moveDrag;
        box.appendChild(cell);
    }));
    const bank = document.getElementById('word-bank'); bank.innerHTML = '';
    words.forEach(w => {
        const tag = document.createElement('span'); tag.id = `tag-${w}`;
        tag.className = 'word-tag glass px-3 py-1.5 rounded-xl text-[10px] font-black uppercase';
        tag.innerText = w; bank.appendChild(tag);
    });
    gsap.from('.grid-cell', {scale: 0, opacity: 0, stagger: 0.001, duration: 0.3});
}

let isDragging = false, startEl = null;
function startDrag(e) { isDragging = true; startEl = e.target; updateDrag(e.target); e.target.releasePointerCapture(e.pointerId); }
function moveDrag(e) { if(isDragging) { updateDrag(e.target); playScreech(); } }

function updateDrag(target) {
    if(!target.classList.contains('grid-cell')) return;
    const r1 = parseInt(startEl.dataset.r), c1 = parseInt(startEl.dataset.c);
    const r2 = parseInt(target.dataset.r), c2 = parseInt(target.dataset.c);
    const dr = r2-r1, dc = c2-c1, dist = Math.max(Math.abs(dr), Math.abs(dc));
    const valid = dr===0 || dc===0 || Math.abs(dr)===Math.abs(dc);
    document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('active-drag'));
    if(valid) {
        const sr = dr===0?0:dr/dist, sc = dc===0?0:dc/dist;
        for(let i=0; i<=dist; i++) {
            const cell = document.querySelector(`.grid-cell[data-r="${r1+i*sr}"][data-c="${c1+i*sc}"]`);
            if(cell) cell.classList.add('active-drag');
        }
        const line = document.getElementById('drag-line'), boxRect = document.getElementById('grid-box').getBoundingClientRect();
        const s = startEl.getBoundingClientRect(), e = target.getBoundingClientRect();
        line.setAttribute('x1', s.left+s.width/2 - boxRect.left); line.setAttribute('y1', s.top+s.height/2 - boxRect.top);
        line.setAttribute('x2', e.left+e.width/2 - boxRect.left); line.setAttribute('y2', e.top+e.height/2 - boxRect.top);
        line.setAttribute('visibility', 'visible');
    }
}

window.onpointerup = () => {
    if(!isDragging) return; isDragging = false;
    document.getElementById('drag-line').setAttribute('visibility', 'hidden');
    const selected = Array.from(document.querySelectorAll('.grid-cell.active-drag'));
    const word = selected.map(c => c.innerText).join(''), rev = word.split('').reverse().join('');
    const match = Array.from(document.querySelectorAll('.word-tag:not(.found)')).find(t => t.innerText === word || t.innerText === rev);
    if(match) {
        match.classList.add('found'); foundWords.push(match.innerText);
        playPop(); createStrike(selected);
        score += 100; document.getElementById('score').innerText = score;
        checkWin();
    }
    document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('active-drag'));
}

function createStrike(cells) {
    const box = document.getElementById('grid-box'), boxRect = box.getBoundingClientRect();
    const s = cells[0].getBoundingClientRect(), e = cells[cells.length-1].getBoundingClientRect();
    const line = document.createElement('div');
    line.className = 'strike-line';
    const x1 = s.left+s.width/2 - boxRect.left, y1 = s.top+s.height/2 - boxRect.top;
    const x2 = e.left+e.width/2 - boxRect.left, y2 = e.top+e.height/2 - boxRect.top;
    line.style.width = `${Math.sqrt((x2-x1)**2 + (y2-y1)**2)}px`;
    line.style.left = `${x1}px`; line.style.top = `${y1}px`;
    line.style.transform = `rotate(${Math.atan2(y2-y1, x2-x1)}rad)`;
    box.appendChild(line);
}

function checkWin() {
    if(foundWords.length === document.querySelectorAll('.word-tag').length) {
        clearInterval(timerInt);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        if(activeLvl === unlockedLevel) { unlockedLevel++; localStorage.setItem('ws_elite_unlocked', unlockedLevel); }
        setTimeout(() => {
            document.getElementById('fact-text').innerText = FACTS[Math.floor(Math.random()*FACTS.length)];
            document.getElementById('win-modal').classList.remove('hidden-screen');
            gsap.from('#win-modal .glass', {scale: 0.8, opacity: 0, duration: 0.4});
        }, 800);
    }
}

function startTimer() {
    clearInterval(timerInt); timer = 0;
    timerInt = setInterval(() => {
        timer++;
        const m = Math.floor(timer/60).toString().padStart(2,'0'), s = (timer%60).toString().padStart(2,'0');
        document.getElementById('timer').innerText = `${m}:${s}`;
    }, 1000);
}

window.onload = showMenu;
