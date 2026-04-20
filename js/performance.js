/**
 * TypeFlow Pro — Performance Module
 * Handles: localStorage history, stats computation, WPM chart rendering,
 * level persistence, streak tracking, and progress export.
 */

const Performance = (() => {
    const STORAGE_KEY = 'typeflow_data';
    const MAX_HISTORY = 30;

    const DEFAULT_DATA = {
        username: '',
        interest: 'general',
        codingLang: 'javascript',
        customText: '',
        unlockedLevel: 1,
        completedLevels: [],
        levelStars: {},       // levelId -> star count (0-3)
        bestWpmPerLevel: {},  // levelId -> best wpm
        sessions: [],         // [{wpm, acc, score, combo, level, date, mode}]
        dailyBestWpm: 0,
        lastActiveDate: '',
        streak: 0,
        totalTime: 0,         // minutes spent typing
    };

    let data = {};

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            data = raw ? { ...DEFAULT_DATA, ...JSON.parse(raw) } : { ...DEFAULT_DATA };
        } catch (e) {
            data = { ...DEFAULT_DATA };
        }
        checkDailyStreak();
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch(e) {}
    }

    function checkDailyStreak() {
        const today = new Date().toDateString();
        if (!data.lastActiveDate) {
            data.lastActiveDate = today;
            data.streak = 1;
        } else if (data.lastActiveDate !== today) {
            const last = new Date(data.lastActiveDate);
            const diff = (new Date(today) - last) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                data.streak = (data.streak || 0) + 1;
            } else if (diff > 1) {
                data.streak = 1;
            }
            data.lastActiveDate = today;
            save();
        }
    }

    function recordSession({ wpm, acc, score, combo, levelId, levelName, mode }) {
        checkDailyStreak();

        const session = {
            wpm: Math.round(wpm),
            acc: Math.round(acc),
            score: Math.round(score),
            combo,
            levelId,
            levelName,
            mode: mode || 'solo',
            date: new Date().toISOString(),
        };

        data.sessions.unshift(session);
        if (data.sessions.length > MAX_HISTORY) data.sessions = data.sessions.slice(0, MAX_HISTORY);

        // Update best wpm for the level
        if (!data.bestWpmPerLevel[levelId] || wpm > data.bestWpmPerLevel[levelId]) {
            data.bestWpmPerLevel[levelId] = Math.round(wpm);
        }

        // Update daily best
        if (wpm > (data.dailyBestWpm || 0)) {
            data.dailyBestWpm = Math.round(wpm);
        }

        // Level stars (0-3 based on performance)
        const stars = calculateStars(wpm, acc);
        if (!data.levelStars[levelId] || stars > data.levelStars[levelId]) {
            data.levelStars[levelId] = stars;
        }

        save();
        return session;
    }

    function calculateStars(wpm, acc) {
        if (wpm >= 80 && acc >= 95) return 3;
        if (wpm >= 50 && acc >= 85) return 2;
        if (wpm >= 25 && acc >= 70) return 1;
        return 0;
    }

    /** Check if performance meets unlock criteria for next level */
    function checkLevelUnlock(levelId, wpm, acc) {
        return wpm >= 25 && acc >= 70; // minimum threshold
    }

    function unlockLevel(levelId) {
        if (!data.completedLevels.includes(levelId)) {
            data.completedLevels.push(levelId);
        }
        if (levelId >= data.unlockedLevel) {
            data.unlockedLevel = levelId + 1;
        }
        save();
    }

    function getStats() {
        const sessions = data.sessions;
        if (!sessions.length) {
            return { bestWpm: 0, avgWpm: 0, avgAcc: 0, sessions: 0, streak: data.streak || 0 };
        }
        const bestWpm = Math.max(...sessions.map(s => s.wpm));
        const avgWpm = Math.round(sessions.reduce((a, s) => a + s.wpm, 0) / sessions.length);
        const avgAcc = Math.round(sessions.reduce((a, s) => a + s.acc, 0) / sessions.length);
        return { bestWpm, avgWpm, avgAcc, sessions: sessions.length, streak: data.streak || 0 };
    }

    function getSessions() {
        return data.sessions || [];
    }

    function getUnlockedLevel() { return data.unlockedLevel || 1; }
    function getCompletedLevels() { return data.completedLevels || []; }
    function getLevelStars() { return data.levelStars || {}; }
    function getBestWpmPerLevel() { return data.bestWpmPerLevel || {}; }
    function getDailyBestWpm() { return data.dailyBestWpm || 0; }

    function setProfile(username, interest, codingLang, customText) {
        data.username = username;
        data.interest = interest;
        data.codingLang = codingLang || 'javascript';
        data.customText = customText || '';
        save();
    }
    function getProfile() {
        return {
            username: data.username || '',
            interest: data.interest || 'general',
            codingLang: data.codingLang || 'javascript',
            customText: data.customText || '',
        };
    }

    // ===================== CHART ======================
    function renderChart(canvasEl) {
        const sessions = [...(data.sessions || [])].reverse().slice(-20); // last 20 oldest→newest
        const emptyEl = document.getElementById('chartEmpty');

        if (!sessions.length) {
            canvasEl.style.display = 'none';
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }
        canvasEl.style.display = '';
        if (emptyEl) emptyEl.classList.add('hidden');

        const ctx = canvasEl.getContext('2d');
        const W = canvasEl.offsetWidth || 600;
        const H = 200;
        canvasEl.width = W;
        canvasEl.height = H;

        const wpms = sessions.map(s => s.wpm);
        const accs = sessions.map(s => s.acc);
        const maxWpm = Math.max(...wpms, 10) * 1.15;

        const padL = 48, padR = 20, padT = 20, padB = 30;
        const plotW = W - padL - padR;
        const plotH = H - padT - padB;

        ctx.clearRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padT + (plotH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();

            // Y labels
            const val = Math.round(maxWpm - (maxWpm / 4) * i);
            ctx.fillStyle = 'rgba(100,116,139,0.9)';
            ctx.font = '11px JetBrains Mono, monospace';
            ctx.textAlign = 'right';
            ctx.fillText(val, padL - 6, y + 4);
        }

        function pointX(i) { return padL + (i / (sessions.length - 1 || 1)) * plotW; }
        function wpmY(v) { return padT + plotH - (v / maxWpm) * plotH; }
        function accY(v) { return padT + plotH - (v / 100) * plotH; }

        // Draw filled area under WPM
        if (sessions.length > 1) {
            const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
            grad.addColorStop(0, 'rgba(168,85,247,0.35)');
            grad.addColorStop(1, 'rgba(168,85,247,0)');
            ctx.beginPath();
            ctx.moveTo(pointX(0), wpmY(wpms[0]));
            for (let i = 1; i < sessions.length; i++) {
                const cx = (pointX(i - 1) + pointX(i)) / 2;
                ctx.bezierCurveTo(cx, wpmY(wpms[i-1]), cx, wpmY(wpms[i]), pointX(i), wpmY(wpms[i]));
            }
            ctx.lineTo(pointX(sessions.length - 1), padT + plotH);
            ctx.lineTo(pointX(0), padT + plotH);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
        }

        // Draw WPM line
        function drawLine(values, yFn, color, lineWidth) {
            if (values.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineJoin = 'round';
            ctx.moveTo(pointX(0), yFn(values[0]));
            for (let i = 1; i < values.length; i++) {
                const cx = (pointX(i-1) + pointX(i)) / 2;
                ctx.bezierCurveTo(cx, yFn(values[i-1]), cx, yFn(values[i]), pointX(i), yFn(values[i]));
            }
            ctx.stroke();
        }

        drawLine(wpms, wpmY, '#a855f7', 2.5);

        // Accuracy line (dashed)
        ctx.setLineDash([5, 4]);
        drawLine(accs, accY, 'rgba(6,182,212,0.7)', 1.5);
        ctx.setLineDash([]);

        // Dots on WPM
        sessions.forEach((s, i) => {
            const x = pointX(i), y = wpmY(s.wpm);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#a855f7';
            ctx.shadowColor = 'rgba(168,85,247,0.8)';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // X labels (every session number)
        ctx.fillStyle = 'rgba(100,116,139,0.7)';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        sessions.forEach((_, i) => {
            if (i % Math.max(1, Math.floor(sessions.length / 6)) === 0) {
                ctx.fillText(i + 1, pointX(i), H - 8);
            }
        });
    }

    return {
        load,
        save,
        recordSession,
        unlockLevel,
        checkLevelUnlock,
        getStats,
        getSessions,
        getUnlockedLevel,
        getCompletedLevels,
        getLevelStars,
        getBestWpmPerLevel,
        getDailyBestWpm,
        setProfile,
        getProfile,
        renderChart,
        calculateStars,
        data: () => data,
    };
})();

Performance.load();
