/**
 * TypeFlow Pro — Core Application Logic
 * Integrates screens, level progression, real-time typing engine, animations, and UI states.
 */

const LEVELS = [
    { id: 1, name: 'Letters', chars: 'abcdefghijklmnopqrstuvwxyz'.split('') },
    { id: 2, name: 'Two Letters', chars: ['is', 'an', 'am', 'to', 'do', 'of', 'in', 'it', 'on', 'we', 'as', 'no', 'at', 'or', 'be', 'by', 'he', 'so', 'me', 'up'] },
    { id: 3, name: 'Three Letters', chars: ['the', 'and', 'but', 'for', 'say', 'one', 'all', 'out', 'new', 'top', 'run', 'sit', 'box', 'fun', 'bad', 'cut', 'lot'] },
    { id: 4, name: 'Short Words', chars: ['time', 'year', 'work', 'good', 'just', 'make', 'know', 'take', 'come', 'look', 'want', 'give', 'find', 'tell', 'feel'] },
    { id: 5, name: 'Long Words', chars: ['because', 'different', 'number', 'system', 'program', 'people', 'through', 'between', 'general', 'develop', 'without'] },
    { id: 6, name: 'Punctuation', chars: ['hello!', 'world.', 'typing,', '"quotes"', '(code)', 'a-b-c', '100%', 'speed?'] },
    { id: 7, name: 'Sentences', chars: ['The quick brown fox jumps over the lazy dog.', 'Typing fast requires muscle memory and practice.', 'Consistency is key to mastering any skill.'] },
];

const CODING_SNIPPETS = {
    javascript: ['const num = 42;', 'function init() {}', 'console.log("Hi");', 'let arr = [];', 'obj.method();'],
    python: ['def func(): pass', 'print("Hello")', 'x = [1, 2, 3]', 'for i in range(10):', 'import sys'],
    cpp: ['#include <iostream>', 'int main() {', 'std::cout << "Hi";', 'return 0;', 'std::vector<int> v;'],
    java: ['public class Main {', 'System.out.println("Hi");', 'public static void max()', 'int[] nums = new int[5];'],
    rust: ['fn main() {', 'println!("Hello");', 'let mut x = 5;', 'vec![1, 2, 3]', 'match val {']
};

let currentWordList = LEVELS[0].chars;
let activeLevelId = 1;
let isCodingMode = false;
let isCustomMode = false;

// Typing State
let words = [];
let currentWordIndex = 0;
let timeLimit = 30;
let timeRemaining = timeLimit;
let timerId = null;
let isStarted = false;
let currentScore = 0;
let currentMultiplier = 1.0;
let wordsWithoutError = 0;
let totalKeystrokes = 0;
let typedCorrectChars = 0;
let errors = 0;

// DOM Elements
const DOM = {
    screens: document.querySelectorAll('.screen'),
    navBtns: {
        toSolo: document.getElementById('btnGoSolo'),
        toMulti: document.getElementById('btnGoMulti'),
        toDash: document.getElementById('btnGoDashboard'),
        profBack: document.getElementById('btnProfileBack'),
        lvlBack: document.getElementById('btnLevelBack'),
        gameBack: document.getElementById('btnGameBack'),
        multiBack: document.getElementById('btnMultiBack'),
        dashBack: document.getElementById('btnDashBack'),
        openDashTop: document.getElementById('btnOpenDash'),
    },
    profile: {
        userInput: document.getElementById('usernameInput'),
        intBtns: document.querySelectorAll('.interest-btn'),
        codingOpts: document.getElementById('codingOptions'),
        langBtns: document.querySelectorAll('.lang-btn'),
        customArea: document.getElementById('customTextArea'),
        customInput: document.getElementById('customTextInput'),
        saveBtn: document.getElementById('btnSaveProfile')
    },
    levelMap: document.getElementById('levelMap'),
    game: {
        levelTag: document.getElementById('levelTag'),
        wpmValue: document.getElementById('wpmValue'),
        accValue: document.getElementById('accValue'),
        comboValue: document.getElementById('comboValue'),
        timeValue: document.getElementById('timeValue'),
        scoreValue: document.getElementById('scoreValue'),
        timeBar: document.getElementById('timeBar'),
        typingZone: document.getElementById('typingZone'),
        textDisplay: document.getElementById('textDisplay'),
        input: document.getElementById('typingInput'),
        restartBtn: document.getElementById('btnRestart'),
        leaveBtn: document.getElementById('btnLeaveArena'),
        mpTracks: document.getElementById('multiplayerTracks'),
        tracksContainer: document.getElementById('tracksContainer')
    },
    results: {
        title: document.getElementById('resultsTitle'),
        levelUpBanner: document.getElementById('levelUpBanner'),
        newLevelName: document.getElementById('newLevelName'),
        wpm: document.getElementById('finalWpm'),
        acc: document.getElementById('finalAcc'),
        score: document.getElementById('finalScore'),
        combo: document.getElementById('finalCombo'),
        arenaRes: document.getElementById('arenaResult'),
        playAgain: document.getElementById('btnPlayAgain'),
        home: document.getElementById('btnBackHome')
    },
    multi: {
        userInput: document.getElementById('mpUsernameInput'),
        btnPublic: document.getElementById('btnPublicArena'),
        btnCreate: document.getElementById('btnCreateRoom'),
        btnJoin: document.getElementById('btnJoinRoom'),
        codeInput: document.getElementById('roomCodeInput'),
        codeDisplay: document.getElementById('roomCodeDisplay'),
        codeStr: document.getElementById('generatedRoomCode'),
        btnCopy: document.getElementById('btnCopyCode'),
        statusMsg: document.getElementById('statusMsg'),
        playerList: document.getElementById('playerList'),
        connStatus: document.getElementById('connectionStatus')
    },
    countdown: {
        overlay: document.getElementById('countdownOverlay'),
        num: document.getElementById('countdownNum')
    }
};

// --- Particles Background ---
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let p = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    for(let i=0; i<60; i++) {
        p.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            s: Math.random() * 2 + 0.5,
            vx: Math.random() * 0.4 - 0.2,
            vy: Math.random() * 0.4 - 0.2,
            op: Math.random() * 0.3 + 0.1,
            pop: Math.random() * 0.01
        });
    }

    function draw() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        p.forEach(pp => {
            pp.x += pp.vx; pp.y += pp.vy;
            if(pp.x<0) pp.x=canvas.width; if(pp.x>canvas.width) pp.x=0;
            if(pp.y<0) pp.y=canvas.height; if(pp.y>canvas.height) pp.y=0;
            pp.op += pp.pop;
            if(pp.op > 0.6 || pp.op < 0.1) pp.pop *= -1;
            
            ctx.fillStyle = `rgba(168, 85, 247, ${pp.op})`;
            ctx.beginPath(); ctx.arc(pp.x, pp.y, pp.s, 0, Math.PI*2); ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// --- Screen Management ---
function showScreen(id) {
    DOM.screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// --- Initial Setup & Profile ---
function checkProfile() {
    const prof = Performance.getProfile();
    if (!prof.username) {
        showScreen('screen-profile');
    } else {
        applyProfile(prof);
    }
}

function applyProfile(prof) {
    DOM.profile.userInput.value = prof.username;
    
    // Set interest buttons
    DOM.profile.intBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.interest === prof.interest);
    });
    
    // Toggle options based on interest
    DOM.profile.codingOpts.classList.toggle('hidden', prof.interest !== 'coding');
    DOM.profile.customArea.classList.toggle('hidden', prof.interest !== 'custom');
    
    // Set code language
    DOM.profile.langBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.lang === prof.codingLang);
    });
    
    DOM.profile.customInput.value = prof.customText || '';
    DOM.multi.userInput.value = prof.username;

    // Apply header badge
    const badgeAvatar = document.getElementById('userAvatarTop');
    const badgeName = document.getElementById('userNameTop');
    if (badgeAvatar && badgeName) {
        badgeAvatar.textContent = prof.username.charAt(0).toUpperCase();
        badgeName.textContent = prof.username;
    }

    updateWordSource(prof);
}

function updateWordSource(prof) {
    isCodingMode = prof.interest === 'coding';
    isCustomMode = prof.interest === 'custom';
    
    if (isCodingMode) {
        currentWordList = CODING_SNIPPETS[prof.codingLang] || CODING_SNIPPETS.javascript;
    } else if (isCustomMode) {
        const t = prof.customText.trim();
        currentWordList = t ? t.split(/\s+/) : ['Please', 'enter', 'custom', 'text'];
    } else {
        // general mode, level defines words
        const l = LEVELS.find(x => x.id === activeLevelId) || LEVELS[0];
        currentWordList = l.chars;
    }
}

// --- Profile Events ---
DOM.profile.intBtns.forEach(b => b.addEventListener('click', e => {
    DOM.profile.intBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const i = b.dataset.interest;
    DOM.profile.codingOpts.classList.toggle('hidden', i !== 'coding');
    DOM.profile.customArea.classList.toggle('hidden', i !== 'custom');
}));

DOM.profile.langBtns.forEach(b => b.addEventListener('click', e => {
    DOM.profile.langBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
}));

DOM.profile.saveBtn.addEventListener('click', () => {
    const un = DOM.profile.userInput.value.trim() || 'Player' + Math.floor(Math.random()*1000);
    const int = document.querySelector('.interest-btn.active').dataset.interest;
    const lang = document.querySelector('.lang-btn.active').dataset.lang;
    const ctx = DOM.profile.customInput.value.trim();

    Performance.setProfile(un, int, lang, ctx);
    applyProfile(Performance.getProfile());
    showScreen('screen-levelmap');
    renderLevelMap();
});

// --- Level Map ---
function renderLevelMap() {
    const unlocked = Performance.getUnlockedLevel();
    const completed = Performance.getCompletedLevels();
    const stars = Performance.getLevelStars();
    
    // Daily
    const db = Performance.getDailyBestWpm();
    const pct = Math.min((db / 80) * 100, 100);
    document.getElementById('dailyProgress').style.width = pct + '%';
    document.getElementById('dailyProgressLabel').textContent = db + ' / 80 WPM';

    if (isCodingMode || isCustomMode) {
        // Simple map for custom modes
        DOM.levelMap.innerHTML = `
            <div class="level-node unlocked current" onclick="startSoloGame(${activeLevelId})">
                <div class="level-node-icon">${isCodingMode ? '💻' : '✏️'}</div>
                <div class="level-node-name">${isCodingMode ? 'Coding Practice' : 'Custom Text'}</div>
                <div class="level-node-desc">Unlimited practice</div>
            </div>`;
        return;
    }

    DOM.levelMap.innerHTML = '';
    LEVELS.forEach(lvl => {
        const isUnlocked = lvl.id <= unlocked;
        const isCurr = lvl.id === activeLevelId;
        const isComp = completed.includes(lvl.id);
        const lStars = stars[lvl.id] || 0;

        const node = document.createElement('div');
        node.className = `level-node ${isCurr ? 'current' : ''} ${isUnlocked ? 'unlocked' : 'locked'} ${isComp ? 'completed' : ''}`;
        
        let starHtml = '';
        if (isComp) {
            starHtml = '<div class="level-node-stars">' + '⭐'.repeat(lStars) + '</div>';
        }

        node.innerHTML = `
            <div class="level-node-badge">${isUnlocked ? (isComp ? '✓' : '') : '🔒'}</div>
            <div class="level-node-num">Level ${lvl.id}</div>
            <div class="level-node-name">${lvl.name}</div>
            ${starHtml}
            <div class="level-node-desc">${isUnlocked ? 'Ready to play' : 'Finish previous to unlock'}</div>
        `;

        if (isUnlocked) {
            node.addEventListener('click', () => {
                activeLevelId = lvl.id;
                updateWordSource(Performance.getProfile());
                renderLevelMap(); // update visual
                startSoloGame(lvl.id);
            });
        }
        DOM.levelMap.appendChild(node);
    });
}

// --- Dashboard ---
function renderDashboard() {
    const stats = Performance.getStats();
    document.getElementById('dsBestWpm').textContent = stats.bestWpm;
    document.getElementById('dsAvgWpm').textContent = stats.avgWpm;
    document.getElementById('dsAvgAcc').textContent = stats.avgAcc + '%';
    document.getElementById('dsSessions').textContent = stats.sessions;
    document.getElementById('dsStreak').textContent = stats.streak + '🔥';

    const canvas = document.getElementById('wpmChart');
    if (canvas) Performance.renderChart(canvas);
    
    // Badges
    const blist = document.getElementById('levelBadges');
    blist.innerHTML = '';
    const comp = Performance.getCompletedLevels();
    LEVELS.forEach(l => {
        const done = comp.includes(l.id);
        blist.innerHTML += `<div class="level-badge ${done ? 'badge-done' : 'badge-locked'}">
            ${done?'✓':'🔒'} ${l.name}
        </div>`;
    });

    // History
    const hlist = document.getElementById('historyList');
    hlist.innerHTML = '';
    const sess = Performance.getSessions().slice(0, 10);
    if (!sess.length) hlist.innerHTML = '<div class="chart-empty">No sessions recorded yet.</div>';
    
    sess.forEach(s => {
        const d = new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        hlist.innerHTML += `
            <div class="history-item">
                <div class="hi-wpm">${s.wpm}wpm</div>
                <div class="hi-acc">${s.acc}%</div>
                <div class="hi-level">${s.levelName} (${s.mode})</div>
                <div class="hi-date">${d}</div>
            </div>
        `;
    });
}

// --- Navigation Events ---
DOM.navBtns.toSolo.onclick = () => { showScreen('screen-levelmap'); renderLevelMap(); };
DOM.navBtns.toDash.onclick = () => { showScreen('screen-dashboard'); renderDashboard(); };
DOM.navBtns.openDashTop.onclick = () => { showScreen('screen-dashboard'); renderDashboard(); };
DOM.navBtns.profBack.onclick = () => showScreen('screen-landing');
DOM.navBtns.dashBack.onclick = () => showScreen('screen-landing');
DOM.navBtns.lvlBack.onclick = () => showScreen('screen-landing');
DOM.navBtns.gameBack.onclick = () => { endGame(true); showScreen('screen-levelmap'); };
DOM.navBtns.multiBack.onclick = () => { Multiplayer.disconnect(); showScreen('screen-landing'); };
DOM.results.home.onclick = () => { showScreen('screen-landing'); };
DOM.results.playAgain.onclick = () => {
    if (DOM.game.mpTracks.classList.contains('hidden')) {
        startSoloGame(activeLevelId);
    } else {
        // was multiplayer, go back to lobby
        showScreen('screen-multiplayer');
    }
};

DOM.navBtns.toMulti.onclick = () => {
    showScreen('screen-multiplayer');
    DOM.multi.codeDisplay.classList.add('hidden');
    DOM.multi.playerList.innerHTML = '';
    DOM.multi.statusMsg.textContent = '';
    Multiplayer.connect();
};

// --- Game Engine ---

function generateWords(count) {
    words = [];
    if (isCustomMode && currentWordList.length <= count) {
        // Just use custom text exactly as is, split by words
        words = [...currentWordList];
        return;
    }
    
    for (let i = 0; i < count; i++) {
        // Random pick
        words.push(currentWordList[Math.floor(Math.random() * currentWordList.length)]);
    }
}

function renderTextDisplay() {
    DOM.game.textDisplay.innerHTML = '';
    words.forEach(w => {
        const wl = document.createElement('div');
        wl.className = 'word';
        // handle coding punctuation
        const isCodeStr = isCodingMode || isCustomMode; 
        const chars = isCodeStr ? w.split('') : w.split(''); // same, but maybe split specially later
        
        chars.forEach(c => {
            const s = document.createElement('span');
            s.className = 'letter';
            s.textContent = c;
            wl.appendChild(s);
        });
        DOM.game.textDisplay.appendChild(wl);
    });
    updateVisuals('');
}

function startSoloGame(lvlId) {
    activeLevelId = lvlId;
    updateWordSource(Performance.getProfile());
    
    const lInfo = LEVELS.find(l => l.id === lvlId);
    let title = 'Custom';
    if (isCodingMode) title = 'Coding: ' + Performance.getProfile().codingLang;
    else if (!isCustomMode && lInfo) title = 'Level ' + lInfo.id + ' — ' + lInfo.name;

    DOM.game.levelTag.textContent = title;
    DOM.game.mpTracks.classList.add('hidden');
    DOM.game.restartBtn.classList.remove('hidden');
    DOM.game.leaveBtn.classList.add('hidden');

    resetGameEngine();
    generateWords(50);
    renderTextDisplay();
    showScreen('screen-game');
    
    setTimeout(() => {
        DOM.game.input.focus();
        DOM.game.typingZone.click();
    }, 100);
}

function resetGameEngine() {
    clearInterval(timerId);
    isStarted = false;
    timeRemaining = timeLimit;
    currentWordIndex = 0;
    currentScore = 0;
    currentMultiplier = 1.0;
    wordsWithoutError = 0;
    totalKeystrokes = 0;
    typedCorrectChars = 0;
    errors = 0;

    DOM.game.wpmValue.textContent = '0';
    DOM.game.accValue.textContent = '100%';
    DOM.game.scoreValue.textContent = '0';
    DOM.game.comboValue.textContent = '×1';
    DOM.game.timeValue.textContent = timeRemaining;
    DOM.game.timeBar.style.width = '100%';
    DOM.game.input.value = '';
    DOM.game.textDisplay.style.transform = 'translateY(0)';
}

DOM.game.input.addEventListener('input', (e) => {
    if (timeRemaining <= 0 || words.length === 0) return;
    
    if (!isStarted) {
        isStarted = true;
        timerId = setInterval(gameTick, 1000);
    }

    let val = e.target.value;
    const isSpace = val.endsWith(' ');
    
    if (currentWordIndex >= words.length) return; // done
    
    const targetWord = words[currentWordIndex];
    let typedActual = isSpace ? val.slice(0, -1) : val;

    totalKeystrokes++;

    if (isSpace) {
        // Finish word
        if (typedActual === targetWord) {
            wordsWithoutError++;
            currentMultiplier = Math.min(5.0, +(1.0 + wordsWithoutError * 0.1).toFixed(1));
            const wScore = Math.floor(targetWord.length * 10 * currentMultiplier);
            currentScore += wScore;
            
            // Pop combo
            DOM.game.comboValue.parentElement.style.transform = 'scale(1.2)';
            setTimeout(() => DOM.game.comboValue.parentElement.style.transform = '', 150);
        } else {
            errors++;
            wordsWithoutError = 0;
            currentMultiplier = 1.0;
            // mark word red
            const wEl = DOM.game.textDisplay.children[currentWordIndex];
            if(wEl) wEl.classList.add('error-word');
            DOM.game.typingZone.classList.add('shake');
            setTimeout(() => DOM.game.typingZone.classList.remove('shake'), 400);
        }

        DOM.game.scoreValue.textContent = currentScore;
        DOM.game.comboValue.textContent = '×' + currentMultiplier;
        
        currentWordIndex++;
        e.target.value = ''; // clear input for next word
        
        // Auto extend words if near end in solo
        if (DOM.game.mpTracks.classList.contains('hidden') && !isCustomMode && currentWordIndex >= words.length - 10) {
            let addCount = 30;
            for(let i=0; i<addCount; i++) {
                words.push(currentWordList[Math.floor(Math.random()*currentWordList.length)]);
            }
            // partial re-render is tricky, full re-render resets scroll, just append child
            const frag = document.createDocumentFragment();
            for(let i=words.length-addCount; i<words.length; i++) {
                const wl = document.createElement('div'); wl.className='word';
                words[i].split('').forEach(c => {
                    const s = document.createElement('span'); s.className='letter'; s.textContent=c;
                    wl.appendChild(s);
                });
                frag.appendChild(wl);
            }
            DOM.game.textDisplay.appendChild(frag);
        }
        
        updateVisuals('');
    } else {
        updateVisuals(typedActual);
    }
});

function updateVisuals(typed) {
    const wordEls = DOM.game.textDisplay.children;
    if (!wordEls[currentWordIndex]) return;

    // Reset active classes
    for (let i = 0; i < wordEls.length; i++) {
        wordEls[i].classList.remove('active');
        wordEls[i].style.opacity = i < currentWordIndex ? '0.4' : '1';
    }
    
    const curWordEl = wordEls[currentWordIndex];
    if(curWordEl) curWordEl.classList.add('active');

    // Remove old carets & extras
    document.querySelectorAll('.caret-block').forEach(el => el.classList.remove('caret-block'));
    const oldExtras = curWordEl.querySelectorAll('.extra');
    oldExtras.forEach(e => e.remove());

    const targetWord = words[currentWordIndex];
    if(!targetWord) return;
    
    // Letters
    const letterEls = curWordEl.querySelectorAll('.letter');
    
    // reset current word letters
    letterEls.forEach(el => el.className = 'letter');
    
    let isCorrectSoFar = true;
    for (let i = 0; i < typed.length; i++) {
        if (i < targetWord.length) {
            if (typed[i] === targetWord[i]) {
                letterEls[i].classList.add('correct');
            } else {
                letterEls[i].classList.add('incorrect');
                isCorrectSoFar = false;
            }
        } else {
            // typed too much
            const xtra = document.createElement('span');
            xtra.className = 'letter extra';
            xtra.textContent = typed[i];
            curWordEl.appendChild(xtra);
            isCorrectSoFar = false;
        }
    }

    // Caret placement
    if (typed.length < targetWord.length) {
        letterEls[typed.length].classList.add('caret-block');
    } else {
        // space caret on the word itself
        curWordEl.classList.add('caret-block');
    }

    // Scroll
    if (curWordEl.offsetTop > 40) {
        DOM.game.textDisplay.style.transform = `translateY(-${curWordEl.offsetTop - 10}px)`;
        DOM.game.textDisplay.style.transition = 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)';
    }

    calcRealtimeStats();
}

function calcRealtimeStats() {
    const elapsed = timeLimit - timeRemaining;
    const elapsedMins = elapsed / 60;
    
    let corrChars = 0;
    let actualErrors = errors; // from whole words passed
    
    // sum up completely passed words lengths assuming correct chars = (length+1) * accuracy roughly
    // Better approx: count typedCorrectChars dynamically, but for simplicity:
    for(let i=0; i<currentWordIndex; i++) {
        corrChars += words[i].length + 1; // + space
    }
    
    const wpm = elapsedMins > 0 ? (corrChars / 5) / elapsedMins : 0;
    const netWpm = Math.max(0, Math.round(wpm - (actualErrors / Math.max(1, elapsedMins))));
    
    const acc = totalKeystrokes > 0 ? Math.max(0, Math.round(((totalKeystrokes - errors) / totalKeystrokes) * 100)) : 100;

    DOM.game.wpmValue.textContent = isNaN(netWpm) ? 0 : netWpm;
    DOM.game.accValue.textContent = isNaN(acc) ? 100 : acc + '%';

    // Send mp
    if (!DOM.game.mpTracks.classList.contains('hidden') && Multiplayer.isReallyConnected()) {
        const totChars = words.join('').length + words.length;
        const prog = Math.min((corrChars / totChars) * 100, 100);
        Multiplayer.sendProgress(prog, netWpm);
    }
}

function gameTick() {
    timeRemaining--;
    DOM.game.timeValue.textContent = timeRemaining;
    const pct = (timeRemaining / timeLimit) * 100;
    DOM.game.timeBar.style.width = pct + '%';
    
    calcRealtimeStats();

    if (timeRemaining <= 0) {
        endGame(false);
    }
}

function endGame(forceQuit) {
    clearInterval(timerId);
    isStarted = false;
    DOM.game.input.blur();

    if (forceQuit) return;

    calcRealtimeStats();
    const finalWpm = parseInt(DOM.game.wpmValue.textContent) || 0;
    const finalAcc = parseInt(DOM.game.accValue.textContent) || 0;
    
    const prof = Performance.getProfile();
    let lName = prof.interest === 'general' ? 'Level ' + activeLevelId : 
               (prof.interest === 'coding' ? 'Coding:' + prof.codingLang : 'Custom Mode');

    const sess = Performance.recordSession({
        wpm: finalWpm, acc: finalAcc, score: currentScore, combo: currentMultiplier,
        levelId: activeLevelId, levelName: lName, 
        mode: DOM.game.mpTracks.classList.contains('hidden') ? 'solo' : 'multi'
    });

    DOM.results.wpm.textContent = finalWpm;
    DOM.results.acc.textContent = finalAcc + '%';
    DOM.results.score.textContent = currentScore;
    DOM.results.combo.textContent = '×' + DOM.game.comboValue.textContent.replace('×','');
    
    // Check level unlock for Solo & General mode
    DOM.results.levelUpBanner.classList.add('hidden');
    if (DOM.game.mpTracks.classList.contains('hidden') && prof.interest === 'general') {
        const isUnlock = Performance.checkLevelUnlock(activeLevelId, finalWpm, finalAcc);
        if (isUnlock) {
            Performance.unlockLevel(activeLevelId);
            const nextUnlocked = Performance.getUnlockedLevel();
            if (nextUnlocked > activeLevelId && nextUnlocked <= LEVELS.length) {
                activeLevelId = nextUnlocked; // auto advance
                DOM.results.levelUpBanner.classList.remove('hidden');
                DOM.results.newLevelName.textContent = 'Level ' + activeLevelId;
            }
        }
    }

    if (DOM.game.mpTracks.classList.contains('hidden')) {
        DOM.results.arenaRes.classList.add('hidden');
        showScreen('screen-results');
    }
    // For MP, results screen shown by server event `onGameEnd`
}

DOM.game.restartBtn.onclick = () => {
    resetGameEngine();
    generateWords(50);
    renderTextDisplay();
    DOM.game.input.focus();
};

document.addEventListener('keydown', e => {
    if (e.key === 'Tab' && DOM.screens[3].classList.contains('active') && !DOM.game.restartBtn.classList.contains('hidden')) {
        e.preventDefault();
        DOM.game.restartBtn.click();
    }
});
DOM.game.typingZone.onclick = () => {
    if (DOM.screens[3].classList.contains('active')) DOM.game.input.focus();
};

// --- Multiplayer Integration ---

Multiplayer.setHandlers({
    onConnectStatus: (ok, msg) => {
        DOM.multi.connStatus.textContent = msg;
        DOM.multi.connStatus.style.color = ok ? 'var(--green)' : 'var(--red)';
        if (!ok) {
            DOM.multi.btnPublic.disabled = true;
            DOM.multi.btnCreate.disabled = true;
            DOM.multi.btnJoin.disabled = true;
        } else {
            DOM.multi.btnPublic.disabled = false;
            DOM.multi.btnCreate.disabled = false;
            DOM.multi.btnJoin.disabled = false;
        }
    },
    onRoomCreated: (code) => {
        DOM.multi.codeDisplay.classList.remove('hidden');
        DOM.multi.codeStr.textContent = code;
        DOM.multi.statusMsg.textContent = 'Room created. Waiting for players...';
    },
    onPlayerJoined: (players) => {
        DOM.multi.playerList.innerHTML = '';
        players.forEach(p => {
            const isMe = p.id === Multiplayer.getMyId();
            DOM.multi.playerList.innerHTML += `
                <div class="player-list-item">
                    <div class="pl-avatar">${p.name.charAt(0).toUpperCase()}</div>
                    <div class="pl-name" style="color: ${isMe?'var(--accent)':'inherit'}">${p.name} ${isMe?'(You)':''}</div>
                    <div class="pl-ready">Ready</div>
                </div>
            `;
        });
        if (players.length > 1) {
            DOM.multi.statusMsg.innerHTML = '<span style="color:var(--gold)">Race starting soon!</span>';
        } else {
            DOM.multi.statusMsg.textContent = 'Waiting for others...';
        }
    },
    onCountdown: (num) => {
        DOM.countdown.overlay.classList.remove('hidden');
        DOM.countdown.num.textContent = num;
        DOM.countdown.num.style.animation = 'none';
        void DOM.countdown.num.offsetWidth; // reflow
        DOM.countdown.num.style.animation = 'countPulse 0.8s ease-out';
    },
    onGameStart: (wds, dur) => {
        DOM.countdown.overlay.classList.add('hidden');
        words = wds;
        timeLimit = dur;
        
        DOM.game.levelTag.textContent = 'Multiplayer Arena';
        DOM.game.mpTracks.classList.remove('hidden');
        DOM.game.restartBtn.classList.add('hidden');
        DOM.game.leaveBtn.classList.remove('hidden');
        
        resetGameEngine();
        renderTextDisplay();
        showScreen('screen-game');
        
        setTimeout(() => DOM.game.input.focus(), 100);
        
        // Render initial empty tracks
        DOM.game.tracksContainer.innerHTML = '';
        // players tracked via onProgress
    },
    onProgress: (players) => {
        DOM.game.tracksContainer.innerHTML = '';
        const sorted = [...players].sort((a,b) => b.progress - a.progress);
        
        sorted.forEach(p => {
            const isMe = p.id === Multiplayer.getMyId();
            DOM.game.tracksContainer.innerHTML += `
                <div class="mp-track">
                    <div class="mp-track-name ${isMe?'me':''}">${p.name}</div>
                    <div class="mp-track-bar">
                        <div class="mp-track-fill ${isMe?'me':'other'}" style="width: ${p.progress}%"></div>
                    </div>
                    <div class="mp-track-wpm">${p.wpm}wpm</div>
                </div>
            `;
        });
    },
    onGameEnd: (results) => {
        endGame(false);
        const sorted = Object.values(results).sort((a,b) => b.wpm - a.wpm);
        const winner = sorted[0];
        
        DOM.results.arenaRes.classList.remove('hidden');
        if (winner && winner.id === Multiplayer.getMyId()) {
            DOM.results.arenaRes.innerHTML = `<h3>🏆 You Won!</h3><p>Impressive speed. Ranked #1 with ${winner.wpm} WPM.</p>`;
            triggerConfetti();
        } else if (winner) {
            DOM.results.arenaRes.innerHTML = `<h3>Race Over</h3><p>${winner.name} won with ${winner.wpm} WPM.</p>`;
        }
        
        showScreen('screen-results');
    },
    onError: (msg) => { alert('Arena Error: ' + msg); }
});

DOM.multi.btnPublic.onclick = () => {
    const un = DOM.multi.userInput.value.trim() || 'Guest';
    DOM.multi.statusMsg.textContent = 'Searching for public match...';
    DOM.multi.playerList.innerHTML = '';
    Multiplayer.joinPublicArena(un);
};
DOM.multi.btnCreate.onclick = () => {
    const un = DOM.multi.userInput.value.trim() || 'Host';
    DOM.multi.playerList.innerHTML = '';
    Multiplayer.createPrivateRoom(un);
};
DOM.multi.btnJoin.onclick = () => {
    const un = DOM.multi.userInput.value.trim() || 'Player';
    const code = DOM.multi.codeInput.value.trim();
    if(code.length !== 6) return alert("Enter 6 digit room code");
    DOM.multi.statusMsg.textContent = 'Joining room...';
    DOM.multi.playerList.innerHTML = '';
    Multiplayer.joinPrivateRoom(un, code);
};
DOM.multi.btnCopy.onclick = () => {
    navigator.clipboard.writeText(DOM.multi.codeStr.textContent);
    DOM.multi.btnCopy.textContent = '✓';
    setTimeout(() => DOM.multi.btnCopy.textContent = '📋', 2000);
};

DOM.game.leaveBtn.onclick = () => {
    Multiplayer.disconnect();
    endGame(true);
    showScreen('screen-multiplayer');
};

// --- Confetti FX ---
function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    canvas.classList.remove('hidden');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    let cfs = [];
    const colors = ['#a855f7', '#06b6d4', '#fbbf24', '#22c55e', '#fff'];
    for(let i=0; i<100; i++) {
        cfs.push({
            x: canvas.width/2, y: canvas.height + 20,
            vx: (Math.random()-0.5)*20, vy: (Math.random()-1)*25 - 5,
            s: Math.random()*8+4,
            c: colors[Math.floor(Math.random()*colors.length)],
            r: Math.random()*360, vr: (Math.random()-0.5)*10
        });
    }

    let aId = 0;
    function drawC() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let active = false;
        cfs.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.5; // gravity
            p.r += p.vr;
            if(p.y < canvas.height+50) active = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.r * Math.PI/180);
            ctx.fillStyle = p.c;
            ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s);
            ctx.restore();
        });
        if(active) aId = requestAnimationFrame(drawC);
        else { cancelAnimationFrame(aId); canvas.classList.add('hidden'); }
    }
    drawC();
}

// Start
initParticles();
checkProfile();
