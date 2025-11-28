/**
 * UI Utilities: Sounds, Notifications, and Modals
 */

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = localStorage.getItem('soundEnabled') !== 'false'; // Default true
    }

    toggleMute() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    }

    playTone(freq, type, duration, startTime = 0) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playClick() {
        this.playTone(600, 'sine', 0.1);
    }

    playSuccess() {
        this.playTone(523.25, 'sine', 0.1, 0);    // C5
        this.playTone(659.25, 'sine', 0.1, 0.1);  // E5
        this.playTone(783.99, 'sine', 0.2, 0.2);  // G5
    }

    playError() {
        this.playTone(150, 'sawtooth', 0.3);
        this.playTone(100, 'sawtooth', 0.3, 0.1);
    }

    playToggle(isOn) {
        if (isOn) {
            this.playTone(400, 'sine', 0.1);
            this.playTone(600, 'sine', 0.1, 0.1);
        } else {
            this.playTone(600, 'sine', 0.1);
            this.playTone(400, 'sine', 0.1, 0.1);
        }
    }

    playWhoosh() {
        if (!this.enabled) return;
        
        // Create noise buffer
        const duration = 0.4;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter for "air" sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + duration / 2);
        filter.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + duration);

        // Envelope
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + duration / 2);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }
}

class NotificationSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;

        this.container.appendChild(toast);

        // Play sound based on type
        if (type === 'success') window.sounds.playSuccess();
        if (type === 'error') window.sounds.playError();
        if (type === 'info') window.sounds.playClick();

        // Animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

class ModalSystem {
    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay u-hidden';
        this.overlay.innerHTML = `
            <div class="modal-card">
                <h3 id="modal-title">Confirmación</h3>
                <p id="modal-message">¿Estás seguro?</p>
                <div class="modal-actions">
                    <button id="modal-cancel" class="action-btn btn-secondary">Cancelar</button>
                    <button id="modal-confirm" class="action-btn">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.confirmBtn = this.overlay.querySelector('#modal-confirm');
        this.cancelBtn = this.overlay.querySelector('#modal-cancel');
        
        this.cancelBtn.addEventListener('click', () => this.close(false));
    }

    confirm(message, title = 'Confirmación') {
        return new Promise((resolve) => {
            this.overlay.querySelector('#modal-title').textContent = title;
            this.overlay.querySelector('#modal-message').textContent = message;
            this.overlay.classList.remove('u-hidden');
            
            // Animation
            requestAnimationFrame(() => {
                this.overlay.classList.add('active');
            });

            window.sounds.playClick();

            const handleConfirm = () => {
                this.close(true);
                resolve(true);
                cleanup();
            };

            const handleCancel = () => {
                this.close(false);
                resolve(false);
                cleanup();
            };

            const cleanup = () => {
                this.confirmBtn.removeEventListener('click', handleConfirm);
                this.cancelBtn.removeEventListener('click', handleCancel);
            };

            this.confirmBtn.addEventListener('click', handleConfirm);
            this.cancelBtn.addEventListener('click', handleCancel);
        });
    }

    close(result) {
        this.overlay.classList.remove('active');
        setTimeout(() => {
            this.overlay.classList.add('u-hidden');
        }, 300);
        if (result) window.sounds.playClick(); // Or specific sound
    }
}

class TourManager {
    constructor() {
        // Check if driver is loaded
        if (!window.driver) return;
        
        this.driver = window.driver.js.driver;
        this.tourObj = this.driver({
            showProgress: true,
            animate: true,
            steps: [
                { 
                    element: '#sidebar', 
                    popover: { 
                        title: 'Menú de Navegación', 
                        description: 'Usa este menú lateral para acceder a todas las secciones de la aplicación.',
                        side: "right", 
                        align: 'start' 
                    } 
                },
                { 
                    element: '#menu-perfil', 
                    popover: { 
                        title: 'Tu Perfil', 
                        description: 'Aquí puedes personalizar tu avatar, cambiar tu nombre y ver tus logros (estrellas y trofeos).',
                        side: "right", 
                        align: 'center' 
                    } 
                },
                { 
                    element: '#menu-multiplicar', 
                    popover: { 
                        title: 'Módulos de Aprendizaje', 
                        description: 'Accede a los módulos de Suma, Resta, Multiplicación y División. ¡Es el corazón de la app!',
                        side: "right", 
                        align: 'center' 
                    } 
                },
                { 
                    element: '#menu-herramientas', 
                    popover: { 
                        title: 'Herramientas', 
                        description: 'Utilidades extra como la Calculadora y el Generador de Tablas.',
                        side: "right", 
                        align: 'center' 
                    } 
                },
                { 
                    element: '#menu-aprendizaje', 
                    popover: { 
                        title: 'Material Teórico', 
                        description: 'Repasa conceptos, trucos y guías paso a paso.',
                        side: "right", 
                        align: 'center' 
                    } 
                },
                { 
                    element: '.module-tabs', 
                    popover: { 
                        title: 'Dentro de un Módulo', 
                        description: 'Cada módulo tiene 4 secciones:<br>1. <b>Explicación:</b> Aprende la teoría.<br>2. <b>Generador:</b> Ejercicios libres.<br>3. <b>Práctica:</b> Ejercicios puntuados.<br>4. <b>Examen:</b> ¡Ponte a prueba!',
                        side: "bottom", 
                        align: 'center' 
                    },
                    onHighlightStarted: () => {
                        // Force switch to multiplication module to show tabs
                        if (window.ModuleManager) {
                            window.ModuleManager.switchModule('multiplication');
                        }
                    }
                }
            ],
            onDestroyed: () => {
                localStorage.setItem('tourCompleted', 'true');
                // Optional: Return to home after tour
                if (window.UI) window.UI.changeMode('home');
            }
        });
    }

    start() {
        if (!window.driver) return;
        
        // Only start if not completed yet
        if (!localStorage.getItem('tourCompleted')) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
                this.tourObj.drive();
            }, 1500);
        }
    }
    
    forceStart() {
        if (!window.driver) return;
        this.tourObj.drive();
    }
}

// Initialize Global Instances
window.sounds = new SoundManager();
window.notifications = new NotificationSystem();
window.modals = new ModalSystem();
window.tour = new TourManager();

// Add interaction listener to unlock AudioContext
document.addEventListener('click', () => {
    if (window.sounds.ctx.state === 'suspended') {
        window.sounds.ctx.resume();
    }
}, { once: true });
