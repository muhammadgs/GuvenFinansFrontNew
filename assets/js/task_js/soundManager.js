// soundManager.js - Yalnız Task Səsləri
const SoundManager = {
    sounds: {
        taskCompleted: null,
        taskAdded: null,
        taskRejected: null,
        taskAssigned: null
    },

    // ÖZ SƏS FAİLLARINIZIN YOLLARI
    soundPaths: {
        taskCompleted: '/assets/sounds/new_task_completed',
        taskAdded: '/assets/sounds/new_task_added_1.mp3',
        taskRejected: '/assets/sounds/new_task_rejected.mp3',
        taskAssigned: '/assets/sounds/new_task_assigned.mp3'
    },

    settings: {
        enabled: true,
        volume: 1.0, // Default yüksək
        mute: false,
        playInBackground: true
    },

    initialized: false,
    audioContext: null,

    // ==================== İNİTİALİZASYON ====================
    initialize: function() {
        if (this.initialized) return;

        console.log('🔊 Task SoundManager başladılır...');

        this.loadSettings();
        this.loadAllSounds();
        this.createSimpleUI();

        this.initialized = true;
        console.log('✅ Task SoundManager hazırdır');
    },

    loadSettings: function() {
        try {
            const saved = localStorage.getItem('taskSoundSettings');
            if (saved) {
                this.settings = JSON.parse(saved);
            }
        } catch (e) {
            console.log('Ayarlar yüklənərkən xəta:', e);
        }
    },

    saveSettings: function() {
        try {
            localStorage.setItem('taskSoundSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.log('Ayarlar saxlanarkən xəta:', e);
        }
    },

    loadAllSounds: function() {
        console.log('📥 Task səsləri yüklənir...');

        Object.keys(this.soundPaths).forEach(soundKey => {
            this.loadSound(soundKey);
        });
    },

    loadSound: function(soundKey) {
        try {
            const path = this.soundPaths[soundKey];
            console.log(`📥 ${soundKey} yüklənir: ${path}`);

            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = this.settings.enabled ? this.settings.volume : 0;

            audio.oncanplaythrough = () => {
                console.log(`✅ ${soundKey} yükləndi`);
                this.sounds[soundKey] = audio;
            };

            audio.onerror = (e) => {
                console.error(`❌ ${soundKey} yüklənərkən xəta:`, e);
                this.createFallbackSound(soundKey);
            };

            audio.load();

        } catch (error) {
            console.error(`❌ ${soundKey} yüklənərkən xəta:`, error);
            this.createFallbackSound(soundKey);
        }
    },

    createFallbackSound: function(soundKey) {
        console.log(`🛠️ ${soundKey} üçün fallback səs yaradılır`);

        const audio = new Audio();
        audio.volume = this.settings.volume;
        this.sounds[soundKey] = audio;

        // Fallback səs effekti
        if (window.AudioContext) {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(context.destination);

                // Task tipinə görə səs
                const frequencies = {
                    taskCompleted: [523.25, 659.25, 783.99], // Xoş, yüksək
                    taskAdded: [659.25, 830.61, 987.77],    // Orta
                    taskRejected: [293.66, 349.23, 440.00], // Aşağı, narahat
                    taskAssigned: [440.00, 554.37, 659.25]  // Normal
                };

                const freqSet = frequencies[soundKey] || [440, 554.37, 659.25];
                const now = context.currentTime;

                freqSet.forEach((freq, i) => {
                    oscillator.frequency.setValueAtTime(freq, now + (i * 0.1));
                });

                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

                oscillator.start(now);
                oscillator.stop(now + 0.3);

            } catch (e) {
                console.log('Fallback səs yaradıla bilmədi');
            }
        }
    },

    // ==================== SƏS OYNATMA ====================
    playSound: function(soundKey, volumeMultiplier = 1.0) {
        try {
            // Ayarları yoxla
            if (!this.settings.enabled || this.settings.mute) {
                return false;
            }

            const sound = this.sounds[soundKey];

            if (!sound) {
                console.warn(`❌ "${soundKey}" səsi tapılmadı, yüklənir...`);
                this.loadSound(soundKey);
                setTimeout(() => this.playSound(soundKey, volumeMultiplier), 500);
                return false;
            }

            // Volume hesabla
            const calculatedVolume = Math.min(this.settings.volume * volumeMultiplier, 1.0);

            // Səsi sıfırla və oynat
            sound.currentTime = 0;
            sound.volume = calculatedVolume;

            const playPromise = sound.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Səs oynadıla bilmədi:', error);
                    // Browser notification göndər
                    this.showNotification(soundKey);
                });
            }

            console.log(`🔊 ${soundKey} oynadıldı (${Math.round(calculatedVolume * 100)}%)`);
            return true;

        } catch (error) {
            console.error('Səs oynadılarkən xəta:', error);
            return false;
        }
    },

    // ==================== TASK ƏMƏLİYYATLARI ====================
    playTaskCompleted: function() {
        return this.playSound('taskCompleted', 1.0);
    },

    playTaskAdded: function() {
        return this.playSound('taskAdded', 1.0);
    },

    playTaskRejected: function() {
        return this.playSound('taskRejected', 1.0);
    },

    playTaskAssigned: function() {
        return this.playSound('taskAssigned', 1.0);
    },

    // WebSocket bildirişləri üçün
    playForWebSocketEvent: function(eventType) {
        const eventMap = {
            'task_created': 'taskAdded',
            'task_completed': 'taskCompleted',
            'task_rejected': 'taskRejected',
            'task_assigned': 'taskAssigned',
            'task_updated': 'taskAssigned',
            'task_started': 'taskAdded'
        };

        const soundKey = eventMap[eventType] || 'taskAdded';
        return this.playSound(soundKey);
    },

    // ==================== UI ====================
    createSimpleUI: function() {
        // Səs kontrol düyməsi
        const soundButton = document.createElement('div');
        soundButton.id = 'taskSoundButton';
        soundButton.className = 'task-sound-button';
        soundButton.innerHTML = `
            <button id="soundToggle" class="sound-btn ${this.settings.enabled ? 'enabled' : 'disabled'}" 
                    title="${this.settings.enabled ? 'Səsi söndür' : 'Səsi aç'}">
                <i class="fas fa-${this.settings.enabled ? 'volume-up' : 'volume-mute'}"></i>
            </button>
            <div class="sound-volume-control" style="display: none;">
                <input type="range" id="volumeSlider" min="0" max="1" step="0.1" value="${this.settings.volume}">
                <span id="volumePercent">${Math.round(this.settings.volume * 100)}%</span>
            </div>
        `;

        // Stil əlavə et
        const style = document.createElement('style');
        style.textContent = `
            .task-sound-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
            }
            
            .sound-btn {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: ${this.settings.enabled ? '#4cd964' : '#ff3b30'};
                color: white;
                font-size: 20px;
                cursor: pointer;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            }
            
            .sound-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 15px rgba(0,0,0,0.3);
            }
            
            .sound-btn.enabled {
                background: #4cd964;
            }
            
            .sound-btn.disabled {
                background: #ff3b30;
            }
            
            .sound-volume-control {
                position: absolute;
                bottom: 60px;
                right: 0;
                background: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                width: 200px;
            }
            
            #volumeSlider {
                width: 100%;
                margin: 10px 0;
            }
            
            #volumePercent {
                display: block;
                text-align: center;
                font-weight: bold;
                color: #333;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(soundButton);

        // Event listener-lar
        this.attachUIEvents();
    },

    attachUIEvents: function() {
        const toggleBtn = document.getElementById('soundToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumePercent = document.getElementById('volumePercent');
        const volumeControl = document.querySelector('.sound-volume-control');

        // Səs toggle
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSound();

            // Button-u yenilə
            const icon = toggleBtn.querySelector('i');
            toggleBtn.className = `sound-btn ${this.settings.enabled ? 'enabled' : 'disabled'}`;
            toggleBtn.title = this.settings.enabled ? 'Səsi söndür' : 'Səsi aç';
            icon.className = `fas fa-${this.settings.enabled ? 'volume-up' : 'volume-mute'}`;

            // Test səsi çal (əgər açılıbsa)
            if (this.settings.enabled) {
                this.playTestSound();
            }
        });

        // Volume slider
        volumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            this.setVolume(volume);
            volumePercent.textContent = `${Math.round(volume * 100)}%`;
        });

        // Volume control-u göstər/söndür
        toggleBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            volumeControl.style.display = volumeControl.style.display === 'none' ? 'block' : 'none';
        });

        // Kliklə bağla
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.task-sound-button')) {
                volumeControl.style.display = 'none';
            }
        });
    },

    toggleSound: function() {
        this.settings.enabled = !this.settings.enabled;
        this.applyVolumeToAllSounds();
        this.saveSettings();
    },

    setVolume: function(volume) {
        this.settings.volume = volume;
        this.applyVolumeToAllSounds();
        this.saveSettings();
    },

    applyVolumeToAllSounds: function() {
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.settings.enabled ? this.settings.volume : 0;
            }
        });
    },

    // ==================== YARDIMCI FUNCTIONS ====================
    playTestSound: function() {
        if (!this.settings.enabled) return;

        // Test səsi (taskAdded)
        this.playSound('taskAdded', 0.5);
    },

    showNotification: function(soundKey) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const titles = {
                taskCompleted: '✅ Task Tamamlandı',
                taskAdded: '➕ Yeni Task',
                taskRejected: '❌ Task İmtina',
                taskAssigned: '👤 Task Təyin'
            };

            new Notification(titles[soundKey] || 'Task Bildiriş', {
                icon: '/favicon.ico'
            });
        }
    },

    requestNotificationPermission: function() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    // ==================== TEST FUNCTIONS ====================
    testAllTaskSounds: function() {
        if (!this.settings.enabled) {
            alert('Əvvəlcə səsi açın!');
            return;
        }

        const sounds = ['taskAdded', 'taskCompleted', 'taskRejected', 'taskAssigned'];
        let index = 0;

        const playNext = () => {
            if (index >= sounds.length) return;

            this.playSound(sounds[index], 0.7);
            console.log(`🔊 Test: ${sounds[index]}`);

            index++;
            setTimeout(playNext, 1000);
        };

        playNext();
    }
};

// Auto initialize
document.addEventListener('DOMContentLoaded', function() {
    SoundManager.initialize();
    SoundManager.requestNotificationPermission();

    // Global export
    window.SoundManager = SoundManager;
    window.taskSounds = SoundManager;

    console.log('🔊 Task SoundManager global olaraq hazırdır');
});

// TableManager üçün helper funksiyalar
window.playTaskSound = function(soundType) {
    if (window.SoundManager) {
        switch(soundType) {
            case 'completed':
                return SoundManager.playTaskCompleted();
            case 'added':
                return SoundManager.playTaskAdded();
            case 'rejected':
                return SoundManager.playTaskRejected();
            case 'assigned':
                return SoundManager.playTaskAssigned();
            default:
                return SoundManager.playTaskAdded();
        }
    }
    return false;
};