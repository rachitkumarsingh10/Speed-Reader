// ===================================
// Global Variables & Configuration
// ===================================
const APP_CONFIG = {
    defaultSpeed: 200,
    defaultFontSize: 24,
    defaultTwisterSpeed: 150,
    defaultTwisterFontSize: 28,
    autoSave: true,
    showStats: true,
    theme: 'light'
};

// Default tongue twisters
const DEFAULT_TWISTERS = [
    "She sells seashells by the seashore.",
    "Peter Piper picked a peck of pickled peppers.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    "Red lorry, yellow lorry.",
    "Unique New York.",
    "Toy boat, toy boat, toy boat.",
    "Six slippery snails slid slowly seaward.",
    "Betty Botter bought some butter.",
    "Truly rural.",
    "Irish wristwatch."
];

// ===================================
// Storage Manager
// ===================================
const StorageManager = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to storage:', error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
};

// ===================================
// Statistics Manager
// ===================================
const StatsManager = {
    getStats() {
        return StorageManager.get('statistics', {
            totalSessions: 0,
            totalWords: 0,
            totalTime: 0,
            fastestSpeed: 0,
            twistersPracticed: 0,
            history: []
        });
    },

    saveStats(stats) {
        StorageManager.set('statistics', stats);
    },

    addSession(sessionData) {
        const stats = this.getStats();
        stats.totalSessions++;
        stats.totalWords += sessionData.words || 0;
        stats.totalTime += sessionData.time || 0;
        
        if (sessionData.speed > stats.fastestSpeed) {
            stats.fastestSpeed = sessionData.speed;
        }

        if (sessionData.type === 'twister') {
            stats.twistersPracticed++;
        }

        stats.history.unshift({
            ...sessionData,
            date: new Date().toISOString()
        });

        if (stats.history.length > 100) {
            stats.history = stats.history.slice(0, 100);
        }

        this.saveStats(stats);
        this.checkAchievements();
    },

    getAverageSpeed() {
        const stats = this.getStats();
        if (stats.totalSessions === 0) return 0;
        
        const readingSessions = stats.history.filter(s => s.type === 'reading');
        if (readingSessions.length === 0) return 0;
        
        const totalSpeed = readingSessions.reduce((sum, s) => sum + (s.speed || 0), 0);
        return Math.round(totalSpeed / readingSessions.length);
    },

    checkAchievements() {
        const stats = this.getStats();
        const achievements = StorageManager.get('achievements', {});

        if (stats.totalSessions >= 1 && !achievements['first-session']) {
            achievements['first-session'] = true;
        }

        if (stats.fastestSpeed >= 500 && !achievements['speed-demon']) {
            achievements['speed-demon'] = true;
        }

        if (stats.totalWords >= 10000 && !achievements['bookworm']) {
            achievements['bookworm'] = true;
        }

        if (stats.twistersPracticed >= 20 && !achievements['tongue-master']) {
            achievements['tongue-master'] = true;
        }

        if (stats.totalTime >= 60 && !achievements['dedicated']) {
            achievements['dedicated'] = true;
        }

        if (stats.totalSessions >= 50 && !achievements['consistent']) {
            achievements['consistent'] = true;
        }

        StorageManager.set('achievements', achievements);
    }
};

// ===================================
// Navigation Manager
// ===================================
const NavigationManager = {
    init() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                }
            });
        }
    }
};

// ===================================
// Theme Manager
// ===================================
const ThemeManager = {
    init() {
        const savedTheme = StorageManager.get('theme', 'light');
        this.applyTheme(savedTheme);
    },

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme === 'light') {
            document.body.classList.remove('dark-theme');
        } else if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }
        StorageManager.set('theme', theme);
    }
};

// ===================================
// Reading Trainer
// ===================================
const ReadingTrainer = {
    text: '',
    words: [],
    speed: 200,
    fontSize: 24,
    isPlaying: false,
    isPaused: false,
    animationId: null,
    startTime: null,
    elapsedTime: 0,
    pausedTime: 0,

    init() {
        this.loadSettings();
        this.setupElements();
        this.setupEventListeners();
        this.loadSavedText();
    },

    loadSettings() {
        const settings = StorageManager.get('settings', {});
        this.speed = settings.defaultSpeed || APP_CONFIG.defaultSpeed;
        this.fontSize = settings.defaultFontSize || APP_CONFIG.defaultFontSize;
    },

    setupElements() {
        this.elements = {
            textInput: document.getElementById('textInput'),
            startBtn: document.getElementById('startReadingBtn'),
            clearBtn: document.getElementById('clearTextBtn'),
            inputSection: document.getElementById('inputSection'),
            readingDisplay: document.getElementById('readingDisplay'),
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            restartBtn: document.getElementById('restartBtn'),
            stopBtn: document.getElementById('stopBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            fontSizeSlider: document.getElementById('fontSizeSlider'),
            fontSizeValue: document.getElementById('fontSizeValue'),
            teleprompterContent: document.getElementById('teleprompterContent'),
            teleprompterContainer: document.getElementById('teleprompterContainer'),
            progressFill: document.getElementById('progressFill'),
            progressPercent: document.getElementById('progressPercent'),
            totalWords: document.getElementById('totalWords'),
            currentSpeed: document.getElementById('currentSpeed'),
            elapsedTime: document.getElementById('elapsedTime'),
            remainingTime: document.getElementById('remainingTime')
        };
    },

    setupEventListeners() {
        const { elements } = this;

        if (elements.startBtn) {
            elements.startBtn.addEventListener('click', () => this.startReading());
        }

        if (elements.clearBtn) {
            elements.clearBtn.addEventListener('click', () => this.clearText());
        }

        if (elements.playBtn) {
            elements.playBtn.addEventListener('click', () => this.play());
        }

        if (elements.pauseBtn) {
            elements.pauseBtn.addEventListener('click', () => this.pause());
        }

        if (elements.restartBtn) {
            elements.restartBtn.addEventListener('click', () => this.restart());
        }

        if (elements.stopBtn) {
            elements.stopBtn.addEventListener('click', () => this.stop());
        }

        if (elements.fullscreenBtn) {
            elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        if (elements.speedSlider) {
            elements.speedSlider.value = this.speed;
            elements.speedValue.textContent = this.speed;
            elements.speedSlider.addEventListener('input', (e) => {
                this.speed = parseInt(e.target.value);
                elements.speedValue.textContent = this.speed;
                elements.currentSpeed.textContent = `${this.speed} WPM`;
                this.updateRemainingTime();
            });
        }

        if (elements.fontSizeSlider) {
            elements.fontSizeSlider.value = this.fontSize;
            elements.fontSizeValue.textContent = this.fontSize;
            elements.fontSizeSlider.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                elements.fontSizeValue.textContent = this.fontSize;
                elements.teleprompterContent.style.fontSize = `${this.fontSize}px`;
            });
        }

        if (elements.textInput) {
            elements.textInput.addEventListener('input', () => {
                if (StorageManager.get('settings', {}).autoSave !== false) {
                    this.saveText();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && elements.readingDisplay.style.display !== 'none') {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (this.isPaused) {
                        this.play();
                    } else {
                        this.pause();
                    }
                } else if (e.code === 'ArrowUp') {
                    e.preventDefault();
                    this.speed = Math.min(1000, this.speed + 10);
                    elements.speedSlider.value = this.speed;
                    elements.speedValue.textContent = this.speed;
                    elements.currentSpeed.textContent = `${this.speed} WPM`;
                } else if (e.code === 'ArrowDown') {
                    e.preventDefault();
                    this.speed = Math.max(50, this.speed - 10);
                    elements.speedSlider.value = this.speed;
                    elements.speedValue.textContent = this.speed;
                    elements.currentSpeed.textContent = `${this.speed} WPM`;
                } else if (e.code === 'Escape') {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                }
            }
        });
    },

    loadSavedText() {
        const savedText = StorageManager.get('savedText', '');
        if (savedText && this.elements.textInput) {
            this.elements.textInput.value = savedText;
        }
    },

    saveText() {
        if (this.elements.textInput) {
            StorageManager.set('savedText', this.elements.textInput.value);
        }
    },

    clearText() {
        if (this.elements.textInput) {
            this.elements.textInput.value = '';
            StorageManager.remove('savedText');
        }
    },

    startReading() {
        const text = this.elements.textInput.value.trim();
        if (!text) {
            alert('Please paste some text first!');
            return;
        }

        this.text = text;
        this.words = text.split(/\s+/);
        this.elapsedTime = 0;
        this.pausedTime = 0;

        this.elements.inputSection.style.display = 'none';
        this.elements.readingDisplay.style.display = 'grid';
        this.elements.totalWords.textContent = this.words.length;
        this.elements.currentSpeed.textContent = `${this.speed} WPM`;
        this.elements.teleprompterContent.style.fontSize = `${this.fontSize}px`;

        this.prepareTeleprompter();
        this.updateProgress();
        this.updateRemainingTime();
        this.play();
    },

    prepareTeleprompter() {
        const lines = [];
        let currentLine = [];
        const wordsPerLine = 8;

        for (let i = 0; i < this.words.length; i++) {
            currentLine.push(this.words[i]);
            if (currentLine.length >= wordsPerLine || i === this.words.length - 1) {
                lines.push(currentLine.join(' '));
                currentLine = [];
            }
        }

        this.elements.teleprompterContent.innerHTML = lines.map((line, index) => 
            `<div class="teleprompter-line" data-index="${index}">${line}</div>`
        ).join('');

        this.elements.teleprompterContent.style.top = 
            `${this.elements.teleprompterContainer.offsetHeight}px`;
    },

    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.isPaused = false;
            this.startTime = Date.now() - this.pausedTime;
            this.elements.playBtn.style.display = 'none';
            this.elements.pauseBtn.style.display = 'flex';
            this.animate();
        } else if (this.isPaused) {
            this.isPaused = false;
            this.startTime = Date.now() - this.pausedTime;
            this.elements.playBtn.style.display = 'none';
            this.elements.pauseBtn.style.display = 'flex';
            this.animate();
        }
    },

    pause() {
        this.isPaused = true;
        this.pausedTime = Date.now() - this.startTime;
        this.elements.playBtn.style.display = 'flex';
        this.elements.pauseBtn.style.display = 'none';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    },

    restart() {
        this.elapsedTime = 0;
        this.pausedTime = 0;
        this.elements.teleprompterContent.style.top = 
            `${this.elements.teleprompterContainer.offsetHeight}px`;
        this.updateProgress();
        this.updateRemainingTime();
        if (this.isPlaying && !this.isPaused) {
            this.startTime = Date.now();
        }
    },

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const sessionTime = Math.round(this.elapsedTime / 60000);
        StatsManager.addSession({
            type: 'reading',
            words: this.words.length,
            speed: this.speed,
            time: sessionTime
        });

        this.elements.readingDisplay.style.display = 'none';
        this.elements.inputSection.style.display = 'block';
        this.elements.playBtn.style.display = 'flex';
        this.elements.pauseBtn.style.display = 'none';
    },

    animate() {
        if (!this.isPlaying || this.isPaused) return;

        const now = Date.now();
        this.elapsedTime = now - this.startTime;

        const pixelsPerSecond = (this.speed / 60) * 50;
        const scrollAmount = (pixelsPerSecond / 60);

        const currentTop = parseFloat(this.elements.teleprompterContent.style.top) || 
            this.elements.teleprompterContainer.offsetHeight;
        const newTop = currentTop - scrollAmount;

        this.elements.teleprompterContent.style.top = `${newTop}px`;

        this.updateElapsedTime();
        this.updateProgress();
        this.updateRemainingTime();

        const contentHeight = this.elements.teleprompterContent.offsetHeight;
        if (Math.abs(newTop) >= contentHeight) {
            this.stop();
            return;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    updateProgress() {
        const contentHeight = this.elements.teleprompterContent.offsetHeight;
        const currentTop = parseFloat(this.elements.teleprompterContent.style.top) || 
            this.elements.teleprompterContainer.offsetHeight;
        const scrolled = this.elements.teleprompterContainer.offsetHeight - currentTop;
        const totalScroll = contentHeight + this.elements.teleprompterContainer.offsetHeight;
        const progress = Math.max(0, Math.min(100, (scrolled / totalScroll) * 100));

        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressPercent.textContent = `${Math.round(progress)}%`;
    },

    updateElapsedTime() {
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        this.elements.elapsedTime.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    updateRemainingTime() {
        const wordsRemaining = this.words.length;
        const minutesRemaining = wordsRemaining / this.speed;
        const minutes = Math.floor(minutesRemaining);
        const seconds = Math.floor((minutesRemaining % 1) * 60);
        this.elements.remainingTime.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.elements.teleprompterContainer.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
            this.elements.teleprompterContainer.classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            this.elements.teleprompterContainer.classList.remove('fullscreen');
        }
    }
};

// ===================================
// Tongue Twister Trainer
// ===================================
const TwisterTrainer = {
    twisters: [],
    currentTwister: null,
    currentIndex: -1,
    isPlaying: false,
    isPaused: false,
    speed: 150,
    fontSize: 28,
    repetitions: 0,
    startTime: null,
    elapsedTime: 0,
    pausedTime: 0,
    animationId: null,
    autoRepeat: false,
    editingIndex: -1,

    init() {
        this.loadSettings();
        this.loadTwisters();
        this.setupElements();
        this.setupEventListeners();
        this.renderTwisterList();
    },

    loadSettings() {
        const settings = StorageManager.get('settings', {});
        this.speed = settings.defaultTwisterSpeed || APP_CONFIG.defaultTwisterSpeed;
        this.fontSize = settings.defaultTwisterFontSize || APP_CONFIG.defaultTwisterFontSize;
        this.autoRepeat = settings.autoRepeat || false;
    },

    loadTwisters() {
        this.twisters = StorageManager.get('tongueTwisters', DEFAULT_TWISTERS);
    },

    saveTwisters() {
        StorageManager.set('tongueTwisters', this.twisters);
    },

    setupElements() {
        this.elements = {
            twisterList: document.getElementById('twisterList'),
            addTwisterBtn: document.getElementById('addTwisterBtn'),
            shuffleBtn: document.getElementById('shuffleBtn'),
            prevBtn: document.getElementById('prevTwisterBtn'),
            nextBtn: document.getElementById('nextTwisterBtn'),
            noTwisterSelected: document.getElementById('noTwisterSelected'),
            twisterReadingArea: document.getElementById('twisterReadingArea'),
            twisterContent: document.getElementById('twisterContent'),
            twisterTeleprompter: document.getElementById('twisterTeleprompter'),
            twisterPlayBtn: document.getElementById('twisterPlayBtn'),
            twisterPauseBtn: document.getElementById('twisterPauseBtn'),
            twisterRestartBtn: document.getElementById('twisterRestartBtn'),
            twisterStopBtn: document.getElementById('twisterStopBtn'),
            twisterLoopBtn: document.getElementById('twisterLoopBtn'),
            twisterFullscreenBtn: document.getElementById('twisterFullscreenBtn'),
            twisterSpeedSlider: document.getElementById('twisterSpeedSlider'),
            twisterSpeedValue: document.getElementById('twisterSpeedValue'),
            twisterFontSizeSlider: document.getElementById('twisterFontSizeSlider'),
            twisterFontSizeValue: document.getElementById('twisterFontSizeValue'),
            repetitionCount: document.getElementById('repetitionCount'),
            practiceTime: document.getElementById('practiceTime'),
            twisterModal: document.getElementById('twisterModal'),
            modalTitle: document.getElementById('modalTitle'),
            twisterTextInput: document.getElementById('twisterTextInput'),
            saveTwisterBtn: document.getElementById('saveTwisterBtn'),
            cancelModalBtn: document.getElementById('cancelModalBtn'),
            closeModal: document.getElementById('closeModal')
        };
    },

    setupEventListeners() {
        const { elements } = this;

        if (elements.addTwisterBtn) {
            elements.addTwisterBtn.addEventListener('click', () => this.openAddModal());
        }

        if (elements.shuffleBtn) {
            elements.shuffleBtn.addEventListener('click', () => this.shuffle());
        }

        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', () => this.selectPrevious());
        }

        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', () => this.selectNext());
        }

        if (elements.twisterPlayBtn) {
            elements.twisterPlayBtn.addEventListener('click', () => this.play());
        }

        if (elements.twisterPauseBtn) {
            elements.twisterPauseBtn.addEventListener('click', () => this.pause());
        }

        if (elements.twisterRestartBtn) {
            elements.twisterRestartBtn.addEventListener('click', () => this.restart());
        }

        if (elements.twisterStopBtn) {
            elements.twisterStopBtn.addEventListener('click', () => this.stop());
        }

        if (elements.twisterLoopBtn) {
            elements.twisterLoopBtn.addEventListener('click', () => this.toggleLoop());
            this.updateLoopButton();
        }

        if (elements.twisterFullscreenBtn) {
            elements.twisterFullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        if (elements.twisterSpeedSlider) {
            elements.twisterSpeedSlider.value = this.speed;
            elements.twisterSpeedValue.textContent = this.speed;
            elements.twisterSpeedSlider.addEventListener('input', (e) => {
                this.speed = parseInt(e.target.value);
                elements.twisterSpeedValue.textContent = this.speed;
            });
        }

        if (elements.twisterFontSizeSlider) {
            elements.twisterFontSizeSlider.value = this.fontSize;
            elements.twisterFontSizeValue.textContent = this.fontSize;
            elements.twisterFontSizeSlider.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                elements.twisterFontSizeValue.textContent = this.fontSize;
                elements.twisterContent.style.fontSize = `${this.fontSize}px`;
            });
        }

        if (elements.saveTwisterBtn) {
            elements.saveTwisterBtn.addEventListener('click', () => this.saveTwister());
        }

        if (elements.cancelModalBtn) {
            elements.cancelModalBtn.addEventListener('click', () => this.closeModal());
        }

        if (elements.closeModal) {
            elements.closeModal.addEventListener('click', () => this.closeModal());
        }

        if (elements.twisterModal) {
            elements.twisterModal.addEventListener('click', (e) => {
                if (e.target === elements.twisterModal) {
                    this.closeModal();
                }
            });
        }
    },

    renderTwisterList() {
        if (!this.elements.twisterList) return;

        this.elements.twisterList.innerHTML = this.twisters.map((twister, index) => `
            <div class="twister-item ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                <div class="twister-text">${twister}</div>
                <div class="twister-actions">
                    <button class="twister-btn" onclick="TwisterTrainer.selectTwister(${index})">Practice</button>
                    <button class="twister-btn" onclick="TwisterTrainer.editTwister(${index})">Edit</button>
                    <button class="twister-btn" onclick="TwisterTrainer.deleteTwister(${index})">Delete</button>
                </div>
            </div>
        `).join('');
    },

    selectTwister(index) {
        if (index < 0 || index >= this.twisters.length) return;

        this.currentIndex = index;
        this.currentTwister = this.twisters[index];
        this.repetitions = 0;
        this.elapsedTime = 0;
        this.pausedTime = 0;

        this.elements.noTwisterSelected.style.display = 'none';
        this.elements.twisterReadingArea.style.display = 'block';
        this.elements.twisterContent.textContent = this.currentTwister;
        this.elements.twisterContent.style.fontSize = `${this.fontSize}px`;
        this.elements.repetitionCount.textContent = this.repetitions;
        this.updatePracticeTime();

        this.renderTwisterList();
        this.prepareTeleprompter();
    },

    selectPrevious() {
        if (this.twisters.length === 0) return;
        const newIndex = this.currentIndex <= 0 ? this.twisters.length - 1 : this.currentIndex - 1;
        this.selectTwister(newIndex);
    },

    selectNext() {
        if (this.twisters.length === 0) return;
        const newIndex = this.currentIndex >= this.twisters.length - 1 ? 0 : this.currentIndex + 1;
        this.selectTwister(newIndex);
    },

    shuffle() {
        for (let i = this.twisters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.twisters[i], this.twisters[j]] = [this.twisters[j], this.twisters[i]];
        }
        this.saveTwisters();
        this.renderTwisterList();
        if (this.currentIndex >= 0) {
            this.selectTwister(0);
        }
    },

    openAddModal() {
        this.editingIndex = -1;
        this.elements.modalTitle.textContent = 'Add Tongue Twister';
        this.elements.twisterTextInput.value = '';
        this.elements.twisterModal.classList.add('active');
    },

    editTwister(index) {
        this.editingIndex = index;
        this.elements.modalTitle.textContent = 'Edit Tongue Twister';
        this.elements.twisterTextInput.value = this.twisters[index];
        this.elements.twisterModal.classList.add('active');
    },

    deleteTwister(index) {
        if (confirm('Are you sure you want to delete this tongue twister?')) {
            this.twisters.splice(index, 1);
            this.saveTwisters();
            this.renderTwisterList();
            
            if (index === this.currentIndex) {
                this.currentIndex = -1;
                this.currentTwister = null;
                this.elements.noTwisterSelected.style.display = 'block';
                this.elements.twisterReadingArea.style.display = 'none';
            } else if (index < this.currentIndex) {
                this.currentIndex--;
            }
        }
    },

    saveTwister() {
        const text = this.elements.twisterTextInput.value.trim();
        if (!text) {
            alert('Please enter a tongue twister!');
            return;
        }

        if (this.editingIndex >= 0) {
            this.twisters[this.editingIndex] = text;
        } else {
            this.twisters.push(text);
        }

        this.saveTwisters();
        this.renderTwisterList();
        this.closeModal();
    },

    closeModal() {
        this.elements.twisterModal.classList.remove('active');
    },

    prepareTeleprompter() {
        this.elements.twisterContent.style.top = 
            `${this.elements.twisterTeleprompter.offsetHeight / 2}px`;
    },

    play() {
        if (!this.currentTwister) return;

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.isPaused = false;
            this.startTime = Date.now() - this.pausedTime;
            this.elements.twisterPlayBtn.style.display = 'none';
            this.elements.twisterPauseBtn.style.display = 'flex';
            this.animate();
        } else if (this.isPaused) {
            this.isPaused = false;
            this.startTime = Date.now() - this.pausedTime;
            this.elements.twisterPlayBtn.style.display = 'none';
            this.elements.twisterPauseBtn.style.display = 'flex';
            this.animate();
        }
    },

    pause() {
        this.isPaused = true;
        this.pausedTime = Date.now() - this.startTime;
        this.elements.twisterPlayBtn.style.display = 'flex';
        this.elements.twisterPauseBtn.style.display = 'none';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    },

    restart() {
        this.elapsedTime = 0;
        this.pausedTime = 0;
        this.prepareTeleprompter();
        if (this.isPlaying && !this.isPaused) {
            this.startTime = Date.now();
        }
    },

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const sessionTime = Math.round(this.elapsedTime / 60000);
        StatsManager.addSession({
            type: 'twister',
            words: this.currentTwister.split(/\s+/).length,
            speed: this.speed,
            time: sessionTime
        });

        this.elements.twisterPlayBtn.style.display = 'flex';
        this.elements.twisterPauseBtn.style.display = 'none';
        this.prepareTeleprompter();
    },

    animate() {
        if (!this.isPlaying || this.isPaused) return;

        const now = Date.now();
        this.elapsedTime = now - this.startTime;

        const pixelsPerSecond = (this.speed / 60) * 40;
        const scrollAmount = (pixelsPerSecond / 60);

        const currentTop = parseFloat(this.elements.twisterContent.style.top) || 
            this.elements.twisterTeleprompter.offsetHeight / 2;
        const newTop = currentTop - scrollAmount;

        this.elements.twisterContent.style.top = `${newTop}px`;
        this.updatePracticeTime();

        const contentHeight = this.elements.twisterContent.offsetHeight;
        if (Math.abs(newTop) >= contentHeight + this.elements.twisterTeleprompter.offsetHeight / 2) {
            this.repetitions++;
            this.elements.repetitionCount.textContent = this.repetitions;
            
            if (this.autoRepeat) {
                this.restart();
                this.startTime = Date.now();
                this.animationId = requestAnimationFrame(() => this.animate());
            } else {
                this.stop();
            }
            return;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    updatePracticeTime() {
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        this.elements.practiceTime.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    toggleLoop() {
        this.autoRepeat = !this.autoRepeat;
        this.updateLoopButton();
        
        // Save the setting
        const settings = StorageManager.get('settings', {});
        settings.autoRepeat = this.autoRepeat;
        StorageManager.set('settings', settings);
    },

    updateLoopButton() {
        if (this.elements.twisterLoopBtn) {
            if (this.autoRepeat) {
                this.elements.twisterLoopBtn.classList.add('active');
                this.elements.twisterLoopBtn.style.backgroundColor = '#4CAF50';
                this.elements.twisterLoopBtn.style.color = 'white';
            } else {
                this.elements.twisterLoopBtn.classList.remove('active');
                this.elements.twisterLoopBtn.style.backgroundColor = '';
                this.elements.twisterLoopBtn.style.color = '';
            }
        }
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.elements.twisterTeleprompter.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
            this.elements.twisterTeleprompter.classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            this.elements.twisterTeleprompter.classList.remove('fullscreen');
        }
    }
};

// ===================================
// Statistics Page
// ===================================
const StatisticsPage = {
    init() {
        this.loadStatistics();
        this.setupEventListeners();
    },

    setupEventListeners() {
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
    },

    loadStatistics() {
        const stats = StatsManager.getStats();
        const achievements = StorageManager.get('achievements', {});

        this.updateElement('statTotalSessions', stats.totalSessions);
        this.updateElement('statTotalWords', stats.totalWords.toLocaleString());
        this.updateElement('statAvgSpeed', StatsManager.getAverageSpeed());
        this.updateElement('statFastestSpeed', stats.fastestSpeed);
        this.updateElement('statTotalTime', Math.round(stats.totalTime));
        this.updateElement('statTwistersPracticed', stats.twistersPracticed);

        this.renderHistory(stats.history);
        this.updateAchievements(achievements);
    },

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    },

    renderHistory(history) {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon">📊</div>
                    <p>No reading history yet. Start practicing to see your progress!</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map(session => {
            const date = new Date(session.date);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            const typeLabel = session.type === 'reading' ? 'Reading' : 'Tongue Twister';
            
            return `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-date">${dateStr}</span>
                        <span class="history-type">${typeLabel}</span>
                    </div>
                    <div class="history-details">
                        <div><strong>Words:</strong> ${session.words}</div>
                        <div><strong>Speed:</strong> ${session.speed} WPM</div>
                        <div><strong>Time:</strong> ${session.time} min</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateAchievements(achievements) {
        const achievementCards = document.querySelectorAll('.achievement-card');
        achievementCards.forEach(card => {
            const achievementId = card.dataset.achievement;
            if (achievements[achievementId]) {
                card.classList.add('unlocked');
                const status = card.querySelector('.achievement-status');
                if (status) {
                    status.textContent = '✓ Unlocked';
                    status.classList.remove('locked');
                    status.classList.add('unlocked');
                }
            }
        });
    },

    clearHistory() {
        if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            const stats = StatsManager.getStats();
            stats.history = [];
            StatsManager.saveStats(stats);
            this.loadStatistics();
        }
    }
};

// ===================================
// Settings Page
// ===================================
const SettingsPage = {
    init() {
        this.loadSettings();
        this.setupEventListeners();
    },

    loadSettings() {
        const settings = StorageManager.get('settings', {
            theme: 'light',
            defaultSpeed: 200,
            defaultFontSize: 24,
            defaultTwisterSpeed: 150,
            autoSave: true,
            showStats: true,
            autoRepeat: false
        });

        this.updateElement('themeSelect', settings.theme);
        this.updateElement('defaultSpeedInput', settings.defaultSpeed);
        this.updateElement('defaultFontSizeInput', settings.defaultFontSize);
        this.updateElement('defaultTwisterSpeedInput', settings.defaultTwisterSpeed);
        this.updateCheckbox('autoSaveToggle', settings.autoSave);
        this.updateCheckbox('showStatsToggle', settings.showStats);
        this.updateCheckbox('autoRepeatToggle', settings.autoRepeat);
    },

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    },

    updateCheckbox(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.checked = value;
        }
    },

    setupEventListeners() {
        const saveBtn = document.getElementById('saveSettingsBtn');
        const exportBtn = document.getElementById('exportDataBtn');
        const importBtn = document.getElementById('importDataBtn');
        const resetBtn = document.getElementById('resetDataBtn');
        const themeSelect = document.getElementById('themeSelect');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                document.getElementById('importFileInput').click();
            });
        }

        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => this.importData(e));
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.showResetConfirmation());
        }

        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                ThemeManager.applyTheme(e.target.value);
            });
        }
    },

    saveSettings() {
        const settings = {
            theme: document.getElementById('themeSelect').value,
            defaultSpeed: parseInt(document.getElementById('defaultSpeedInput').value),
            defaultFontSize: parseInt(document.getElementById('defaultFontSizeInput').value),
            defaultTwisterSpeed: parseInt(document.getElementById('defaultTwisterSpeedInput').value),
            autoSave: document.getElementById('autoSaveToggle').checked,
            showStats: document.getElementById('showStatsToggle').checked,
            autoRepeat: document.getElementById('autoRepeatToggle').checked
        };

        StorageManager.set('settings', settings);
        ThemeManager.applyTheme(settings.theme);
        alert('Settings saved successfully!');
    },

    exportData() {
        const data = {
            settings: StorageManager.get('settings', {}),
            statistics: StorageManager.get('statistics', {}),
            tongueTwisters: StorageManager.get('tongueTwisters', []),
            savedText: StorageManager.get('savedText', ''),
            achievements: StorageManager.get('achievements', {}),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `speed-reader-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.settings) StorageManager.set('settings', data.settings);
                if (data.statistics) StorageManager.set('statistics', data.statistics);
                if (data.tongueTwisters) StorageManager.set('tongueTwisters', data.tongueTwisters);
                if (data.savedText) StorageManager.set('savedText', data.savedText);
                if (data.achievements) StorageManager.set('achievements', data.achievements);

                alert('Data imported successfully! The page will reload.');
                location.reload();
            } catch (error) {
                alert('Error importing data. Please check the file format.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }
};

// ===================================
// Memory Test
// ===================================
const MemoryTest = {
    originalText: '',
    readingTime: 30,
    fontSize: 24,
    timerInterval: null,
    remainingTime: 0,
    phase: 'setup', // setup, reading, writing, results

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.loadSettings();
    },

    setupElements() {
        this.elements = {
            setupPhase: document.getElementById('setupPhase'),
            readingPhase: document.getElementById('readingPhase'),
            writingPhase: document.getElementById('writingPhase'),
            resultsPhase: document.getElementById('resultsPhase'),
            memoryTextInput: document.getElementById('memoryTextInput'),
            readingTimeInput: document.getElementById('readingTimeInput'),
            readingTimeValue: document.getElementById('readingTimeValue'),
            memoryFontSizeInput: document.getElementById('memoryFontSizeInput'),
            memoryFontSizeValue: document.getElementById('memoryFontSizeValue'),
            startMemoryTestBtn: document.getElementById('startMemoryTestBtn'),
            memoryTextDisplay: document.getElementById('memoryTextDisplay'),
            timerDisplay: document.getElementById('timerDisplay'),
            cancelReadingBtn: document.getElementById('cancelReadingBtn'),
            memoryRecallInput: document.getElementById('memoryRecallInput'),
            cancelWritingBtn: document.getElementById('cancelWritingBtn'),
            submitRecallBtn: document.getElementById('submitRecallBtn'),
            accuracyScore: document.getElementById('accuracyScore'),
            wordsRemembered: document.getElementById('wordsRemembered'),
            readingTimeUsed: document.getElementById('readingTimeUsed'),
            originalText: document.getElementById('originalText'),
            recalledText: document.getElementById('recalledText'),
            detailedAnalysis: document.getElementById('detailedAnalysis'),
            newTestBtn: document.getElementById('newTestBtn'),
            retryTestBtn: document.getElementById('retryTestBtn')
        };
    },

    setupEventListeners() {
        const { elements } = this;

        if (elements.readingTimeInput) {
            elements.readingTimeInput.addEventListener('input', (e) => {
                this.readingTime = parseInt(e.target.value);
                elements.readingTimeValue.textContent = this.readingTime;
            });
        }

        if (elements.memoryFontSizeInput) {
            elements.memoryFontSizeInput.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                elements.memoryFontSizeValue.textContent = this.fontSize;
            });
        }

        if (elements.startMemoryTestBtn) {
            elements.startMemoryTestBtn.addEventListener('click', () => this.startTest());
        }

        if (elements.cancelReadingBtn) {
            elements.cancelReadingBtn.addEventListener('click', () => this.cancelTest());
        }

        if (elements.cancelWritingBtn) {
            elements.cancelWritingBtn.addEventListener('click', () => this.cancelTest());
        }

        if (elements.submitRecallBtn) {
            elements.submitRecallBtn.addEventListener('click', () => this.submitRecall());
        }

        if (elements.newTestBtn) {
            elements.newTestBtn.addEventListener('click', () => this.newTest());
        }

        if (elements.retryTestBtn) {
            elements.retryTestBtn.addEventListener('click', () => this.retryTest());
        }
    },

    loadSettings() {
        const settings = StorageManager.get('settings', {});
        this.readingTime = settings.memoryReadingTime || 30;
        this.fontSize = settings.memoryFontSize || 24;

        if (this.elements.readingTimeInput) {
            this.elements.readingTimeInput.value = this.readingTime;
            this.elements.readingTimeValue.textContent = this.readingTime;
        }

        if (this.elements.memoryFontSizeInput) {
            this.elements.memoryFontSizeInput.value = this.fontSize;
            this.elements.memoryFontSizeValue.textContent = this.fontSize;
        }
    },

    startTest() {
        const text = this.elements.memoryTextInput.value.trim();
        if (!text) {
            alert('Please enter some text to memorize!');
            return;
        }

        this.originalText = text;
        this.showPhase('reading');
        this.startReadingPhase();
    },

    startReadingPhase() {
        this.elements.memoryTextDisplay.textContent = this.originalText;
        this.elements.memoryTextDisplay.style.fontSize = `${this.fontSize}px`;
        this.remainingTime = this.readingTime;
        this.updateTimer();
        
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            this.updateTimer();
            
            if (this.remainingTime <= 0) {
                this.endReadingPhase();
            }
        }, 1000);
    },

    updateTimer() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        this.elements.timerDisplay.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    endReadingPhase() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.showPhase('writing');
        this.elements.memoryRecallInput.value = '';
        this.elements.memoryRecallInput.focus();
    },

    cancelTest() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.showPhase('setup');
    },

    submitRecall() {
        const recalledText = this.elements.memoryRecallInput.value.trim();
        if (!recalledText) {
            alert('Please write what you remember!');
            return;
        }

        this.calculateResults(recalledText);
        this.showPhase('results');
    },

    calculateResults(recalledText) {
        const originalWords = this.originalText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const recalledWords = recalledText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        
        // Calculate word matches
        let matchedWords = 0;
        const originalSet = new Set(originalWords);
        const recalledSet = new Set(recalledWords);
        
        recalledWords.forEach(word => {
            if (originalSet.has(word)) {
                matchedWords++;
            }
        });

        // Calculate accuracy
        const accuracy = originalWords.length > 0 
            ? Math.round((matchedWords / originalWords.length) * 100) 
            : 0;

        // Update results display
        this.elements.accuracyScore.textContent = `${accuracy}%`;
        this.elements.wordsRemembered.textContent = `${matchedWords}/${originalWords.length}`;
        this.elements.readingTimeUsed.textContent = `${this.readingTime}s`;
        this.elements.originalText.textContent = this.originalText;
        this.elements.recalledText.textContent = recalledText;

        // Detailed analysis
        const missedWords = originalWords.filter(word => !recalledSet.has(word));
        const extraWords = recalledWords.filter(word => !originalSet.has(word));

        let analysisHTML = '<div class="analysis-section">';
        
        if (matchedWords > 0) {
            analysisHTML += `<p><strong>✓ Correctly Remembered:</strong> ${matchedWords} words</p>`;
        }
        
        if (missedWords.length > 0) {
            analysisHTML += `<p><strong>✗ Missed Words:</strong> ${missedWords.slice(0, 10).join(', ')}`;
            if (missedWords.length > 10) {
                analysisHTML += ` and ${missedWords.length - 10} more...`;
            }
            analysisHTML += '</p>';
        }
        
        if (extraWords.length > 0) {
            analysisHTML += `<p><strong>⚠ Extra Words (not in original):</strong> ${extraWords.slice(0, 10).join(', ')}`;
            if (extraWords.length > 10) {
                analysisHTML += ` and ${extraWords.length - 10} more...`;
            }
            analysisHTML += '</p>';
        }

        analysisHTML += '</div>';
        this.elements.detailedAnalysis.innerHTML = analysisHTML;

        // Save to statistics
        StatsManager.addSession({
            type: 'memory',
            words: originalWords.length,
            accuracy: accuracy,
            time: Math.round(this.readingTime / 60)
        });
    },

    showPhase(phase) {
        this.phase = phase;
        this.elements.setupPhase.style.display = phase === 'setup' ? 'block' : 'none';
        this.elements.readingPhase.style.display = phase === 'reading' ? 'block' : 'none';
        this.elements.writingPhase.style.display = phase === 'writing' ? 'block' : 'none';
        this.elements.resultsPhase.style.display = phase === 'results' ? 'block' : 'none';
    },

    newTest() {
        this.elements.memoryTextInput.value = '';
        this.showPhase('setup');
    },

    retryTest() {
        this.elements.memoryTextInput.value = this.originalText;
        this.showPhase('setup');
    }
};

// ===================================
// Home Page
// ===================================
const HomePage = {
    init() {
        this.loadStats();
    },

    loadStats() {
        const stats = StatsManager.getStats();
        
        this.updateElement('homeSessionCount', stats.totalSessions);
        this.updateElement('homeWordsRead', stats.totalWords.toLocaleString());
        this.updateElement('homeAvgSpeed', StatsManager.getAverageSpeed());
        this.updateElement('homePracticeTime', Math.round(stats.totalTime));
    },

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
};

// ===================================
// Initialize Application
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    NavigationManager.init();
    ThemeManager.init();

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'index.html' || currentPage === '') {
        HomePage.init();
    } else if (currentPage === 'reading.html') {
        ReadingTrainer.init();
    } else if (currentPage === 'tongue-twisters.html') {
        TwisterTrainer.init();
    } else if (currentPage === 'memory-test.html') {
        MemoryTest.init();
    } else if (currentPage === 'statistics.html') {
        StatisticsPage.init();
    } else if (currentPage === 'settings.html') {
        SettingsPage.init();
    }
});

// Made with Bob
