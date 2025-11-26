/**
 * UI Utilities: Sounds, Notifications, and Modals
 */

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
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

// Initialize Global Instances
window.sounds = new SoundManager();
window.notifications = new NotificationSystem();
window.modals = new ModalSystem();

// Add interaction listener to unlock AudioContext
document.addEventListener('click', () => {
    if (window.sounds.ctx.state === 'suspended') {
        window.sounds.ctx.resume();
    }
}, { once: true });
