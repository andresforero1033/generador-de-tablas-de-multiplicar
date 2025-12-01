/**
 * Profile Manager
 * Handles user profile, avatar, and stats.
 */
const ProfileManager = {
    DEFAULT_PROFILE: {
        name: 'Explorador',
        avatar: '🦁',
        level: 1,
        stars: 0,
        trophies: 0,
        exercisesCompleted: 0,
        badges: [],
        gameRecords: {
            multiplicationRush: 0
        },
        history: []
    },

    data: {
        name: 'Explorador',
        avatar: '🦁',
        level: 1,
        stars: 0,
        trophies: 0,
        exercisesCompleted: 0,
        badges: [],
        gameRecords: {
            multiplicationRush: 0
        },
        history: []
    },

    ready: false,

    init: async () => {
        await ProfileManager.loadData();
        ProfileManager.renderProfile();
        ProfileManager.ready = true;
        ProfileManager.dispatchEvent('profile:ready');
    },

    dispatchEvent: (name) => {
        document.dispatchEvent(new CustomEvent(name, { detail: ProfileManager.data }));
    },

    normalizeProfile: (profile = {}) => {
        const normalized = {
            ...ProfileManager.DEFAULT_PROFILE,
            ...profile
        };
        normalized.gameRecords = {
            ...ProfileManager.DEFAULT_PROFILE.gameRecords,
            ...(profile.gameRecords || {})
        };
        normalized.history = Array.isArray(profile.history) ? profile.history : [];
        return normalized;
    },

    persistLocalCache: () => {
        try {
            localStorage.setItem('userProfile', JSON.stringify(ProfileManager.data));
        } catch (error) {
            console.warn('No se pudo guardar el perfil localmente', error);
        }
    },

    loadFromLocal: () => {
        const saved = localStorage.getItem('userProfile');
        if (saved) {
            try {
                ProfileManager.data = ProfileManager.normalizeProfile(JSON.parse(saved));
                return;
            } catch (error) {
                console.warn('No se pudo leer el perfil local', error);
            }
        }
        ProfileManager.data = { ...ProfileManager.DEFAULT_PROFILE };
        const authUser = localStorage.getItem('username');
        if (authUser) ProfileManager.data.name = authUser;
    },

    loadData: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            ProfileManager.loadFromLocal();
            return;
        }

        try {
            const response = await fetch('/api/profile', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                ProfileManager.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error('No se pudo obtener el perfil');
            }

            const payload = await response.json();
            ProfileManager.data = ProfileManager.normalizeProfile(payload.profile);
            ProfileManager.persistLocalCache();
        } catch (error) {
            console.error('No se pudo sincronizar el perfil', error);
            ProfileManager.loadFromLocal();
        }
    },

    handleUnauthorized: () => {
        if (typeof UI !== 'undefined' && typeof UI.clearViewState === 'function') {
            UI.clearViewState();
        }
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userProfile');
        window.location.href = '/';
    },

    getSerializableProfile: () => {
        const { name, avatar, level, stars, trophies, exercisesCompleted, gameRecords } = ProfileManager.data;
        return { name, avatar, level, stars, trophies, exercisesCompleted, gameRecords };
    },

    saveData: async () => {
        ProfileManager.persistLocalCache();
        ProfileManager.renderProfile();
        ProfileManager.dispatchEvent('profile:updated');

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ profile: ProfileManager.getSerializableProfile() })
            });

            if (response.status === 401) {
                ProfileManager.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error('No se pudo actualizar el perfil');
            }

            const payload = await response.json();
            ProfileManager.data = ProfileManager.normalizeProfile(payload.profile);
            ProfileManager.persistLocalCache();
            ProfileManager.renderProfile();
            ProfileManager.dispatchEvent('profile:updated');
        } catch (error) {
            console.error('Error sincronizando el perfil con el servidor', error);
        }
    },

    addHistoryEntry: async (type, payload = {}) => {
        if (!type) return;
        if (!Array.isArray(ProfileManager.data.history)) {
            ProfileManager.data.history = [];
        }

        const entry = {
            clientId: ProfileManager.generateClientId(),
            type,
            module: payload.module || 'general',
            score: typeof payload.score === 'number' ? payload.score : 0,
            totalQuestions: typeof payload.totalQuestions === 'number' ? payload.totalQuestions : undefined,
            grade: typeof payload.grade === 'number' ? payload.grade : undefined,
            meta: payload.meta || {},
            createdAt: new Date().toISOString()
        };

        ProfileManager.data.history.unshift(entry);
        ProfileManager.data.history = ProfileManager.data.history.slice(0, 50);
        ProfileManager.persistLocalCache();
        ProfileManager.dispatchEvent('profile:updated');

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/profile/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ entry })
            });

            if (response.status === 401) {
                ProfileManager.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error('No se pudo guardar el historial');
            }

            const payload = await response.json();
            if (Array.isArray(payload.history)) {
                ProfileManager.data.history = payload.history.map((item) => ({
                    ...item,
                    createdAt: item.createdAt || new Date().toISOString()
                }));
                ProfileManager.persistLocalCache();
                ProfileManager.dispatchEvent('profile:updated');
            }
        } catch (error) {
            console.error('Error sincronizando el historial', error);
        }
    },

    generateClientId: () => {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    },

    renderProfile: () => {
        const { name, avatar, level, stars, trophies, exercisesCompleted } = ProfileManager.data;
        
        // Update Header
        const avatarEl = document.getElementById('profile-avatar');
        const nameEl = document.getElementById('profile-name');
        const levelEl = document.getElementById('profile-level');
        
        if(avatarEl) avatarEl.textContent = avatar;
        // Only update text if not in edit mode (checking if it has an input child)
        if(nameEl && !nameEl.querySelector('input')) {
            nameEl.textContent = name;
            // Add edit button if not present
            if (!document.getElementById('edit-name-btn')) {
                const editBtn = document.createElement('button');
                editBtn.id = 'edit-name-btn';
                editBtn.className = 'edit-name-btn';
                editBtn.innerHTML = '✏️';
                editBtn.onclick = ProfileManager.toggleNameEdit;
                editBtn.title = "Cambiar Nombre";
                nameEl.appendChild(editBtn);
            }
        }
        if(levelEl) levelEl.textContent = level;

        // Update Stats
        const starsEl = document.getElementById('profile-stars');
        const trophiesEl = document.getElementById('profile-trophies');
        const exercisesEl = document.getElementById('profile-exercises');

        if(starsEl) starsEl.textContent = stars;
        if(trophiesEl) trophiesEl.textContent = trophies;
        if(exercisesEl) exercisesEl.textContent = exercisesCompleted;

        // Render Badges
        ProfileManager.renderBadges();
        ProfileManager.renderGameRecords();
    },

    renderBadges: () => {
        const container = document.getElementById('badges-container');
        if (!container) return;

        const allBadges = [
            { id: 'beginner', icon: '🥉', name: 'Principiante', desc: 'Completa 10 ejercicios', condition: (d) => d.exercisesCompleted >= 10 },
            { id: 'genius', icon: '🥇', name: 'Genio', desc: 'Gana 50 estrellas', condition: (d) => d.stars >= 50 },
            { id: 'master', icon: '👑', name: 'Maestro', desc: 'Nivel 5 alcanzado', condition: (d) => d.level >= 5 },
            { id: 'collector', icon: '🏆', name: 'Coleccionista', desc: 'Gana 5 trofeos', condition: (d) => d.trophies >= 5 }
        ];

        let html = '';
        allBadges.forEach(badge => {
            const isUnlocked = badge.condition(ProfileManager.data);
            html += `
                <div class="badge ${isUnlocked ? 'unlocked' : 'locked'}" title="${badge.desc}">
                    <div class="badge-icon">${badge.icon}</div>
                    <span>${badge.name}</span>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderGameRecords: () => {
        const container = document.getElementById('game-records');
        if (!container) return;

        const { gameRecords } = ProfileManager.data;
        const best = gameRecords?.multiplicationRush || 0;

        container.innerHTML = `
            <div class="record-card">
                <div class="record-icon">🎮</div>
                <div>
                    <p>Multiplicación Contrarreloj</p>
                    <strong>${best} pts</strong>
                </div>
            </div>
        `;
    },

    toggleNameEdit: () => {
        const nameEl = document.getElementById('profile-name');
        if (!nameEl) return;
        
        const currentName = ProfileManager.data.name;
        
        // Switch to edit mode
        nameEl.innerHTML = `
            <input type="text" id="profile-name-input" value="${currentName}" class="profile-name-input"
                   onblur="ProfileManager.saveName(this.value)" 
                   onkeydown="if(event.key === 'Enter') ProfileManager.saveName(this.value)">
        `;
        
        setTimeout(() => {
            const input = document.getElementById('profile-name-input');
            if(input) {
                input.focus();
                input.select();
            }
        }, 50);
    },

    saveName: (newName) => {
        if (newName && newName.trim() !== '') {
            ProfileManager.data.name = newName.trim();
            ProfileManager.saveData();
            window.notifications.show('Nombre actualizado', 'success');
        }
        
        // Force exit edit mode by clearing the element content
        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.innerHTML = ''; 
        
        ProfileManager.renderProfile();
    },

    toggleAvatarSelector: () => {
        const selector = document.getElementById('avatar-selector');
        if (selector) {
            selector.classList.toggle('u-hidden');
            if (!selector.classList.contains('u-hidden')) {
                // Scroll to selector to ensure visibility on mobile
                setTimeout(() => {
                    selector.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
    },

    setAvatar: (emoji) => {
        ProfileManager.data.avatar = emoji;
        ProfileManager.saveData();
        ProfileManager.toggleAvatarSelector();
        window.notifications.show('¡Avatar actualizado!', 'success');
    },

    // Helper to update stats from other modules
    addProgress: (stars = 0, exercises = 0) => {
        ProfileManager.data.stars += stars;
        ProfileManager.data.exercisesCompleted += exercises;
        
        // Level up logic (simple: every 100 stars)
        const newLevel = Math.floor(ProfileManager.data.stars / 100) + 1;
        if (newLevel > ProfileManager.data.level) {
            ProfileManager.data.level = newLevel;
            window.notifications.show(`¡Subiste al Nivel ${newLevel}! 🎉`, 'success');
            window.sounds.playSuccess();
        }

        ProfileManager.saveData();
    },

    addTrophy: () => {
        ProfileManager.data.trophies++;
        window.notifications.show('¡Nuevo Trofeo Ganado! 🏆', 'success');
        window.sounds.playSuccess();
        ProfileManager.saveData();
    },

    updateGameRecord: (gameId, score) => {
        if (!ProfileManager.data.gameRecords) {
            ProfileManager.data.gameRecords = {};
        }

        const current = ProfileManager.data.gameRecords[gameId] || 0;
        if (score > current) {
            ProfileManager.data.gameRecords[gameId] = score;
            ProfileManager.saveData();
            window.notifications.show('¡Nuevo récord desbloqueado! 🎮', 'success');
            if (window.confetti) {
                window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
            return true;
        }
        ProfileManager.renderGameRecords();
        return false;
    }
};

// Initialize Profile on load
document.addEventListener('DOMContentLoaded', ProfileManager.init);

// Expose globally
window.ProfileManager = ProfileManager;

/**
 * Module Manager
 * Handles UI and Logic for the redesigned Math Modules.
 */

const ModuleManager = {
    currentModule: 'multiplication', // 'multiplication' or 'division'
    currentTab: 'explicacion',
    
    state: {
        practice: {
            isActive: false,
            currentQuestionIndex: 0,
            totalQuestions: 5,
            questions: [], // Array of { problem, solution }
            results: [], // Array of { questionIndex, userAnswer, isCorrect }
            score: 0
        },
        exam: {
            isActive: false,
            questions: [],
            answers: [],
            timeLeft: 0,
            timerInterval: null,
            config: {
                count: 10,
                timeLimit: 0 // minutes, 0 = unlimited
            },
            attempts: 0,
            maxAttempts: 2,
            submitted: false,
            currentQuestionIndex: 0 // Nuevo estado para navegación
        }
    },

    contextualScenarioBank: {
        multiplication: [
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                template: ({ a, b }) => ({
                    description: `Compras ${a} cajas y cada una trae ${b} galletas frescas.`,
                    question: '¿Cuántas galletas tendrás al llegar a casa?',
                    tip: 'Multiplica el número de cajas por el contenido de cada una.'
                })
            },
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                template: ({ a, b }) => ({
                    description: `Una maestra organiza ${a} filas con ${b} estudiantes en cada fila para el acto cultural.`,
                    question: '¿Cuántos estudiantes participan en total?',
                    tip: 'Piensa en filas repetidas: filas × estudiantes por fila.'
                })
            },
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                template: ({ a, b }) => ({
                    description: `Cada estante puede guardar ${b} libros y en la biblioteca se llenan ${a} estantes completos.`,
                    question: '¿Cuántos libros están ordenados?',
                    tip: 'Multiplica estantes por libros por estante.'
                })
            }
        ],
        addition: [
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                template: ({ a, b }) => ({
                    description: `Camila recorrió ${a} km en la mañana y ${b} km en la tarde.` ,
                    question: '¿Qué distancia total caminó en el día?',
                    tip: 'Suma los kilómetros de ambos momentos.'
                })
            },
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                template: ({ a, b }) => ({
                    description: `Ahorras ${a} monedas esta semana y tu familia te regala ${b} monedas más.`,
                    question: '¿Con cuántas monedas cuentas ahora?',
                    tip: 'Une ambos montos para obtener el total.'
                })
            },
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                template: ({ a, b }) => ({
                    description: `Una receta usa ${a} gramos de harina y agregas ${b} gramos adicionales para duplicar la mezcla.`,
                    question: '¿Cuánta harina empleaste en total?',
                    tip: 'Suma la medida base más el refuerzo.'
                })
            }
        ],
        subtraction: [
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                condition: ({ a, b }) => a >= b,
                template: ({ a, b }) => ({
                    description: `Había ${a} entradas disponibles para un concierto y ya se vendieron ${b}.`,
                    question: '¿Cuántas entradas quedan por vender?',
                    tip: 'Resta las vendidas del total inicial.'
                })
            },
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                condition: ({ a, b }) => a >= b,
                template: ({ a, b }) => ({
                    description: `Un tanque almacenaba ${a} litros de agua y se utilizaron ${b} litros para regar el huerto.`,
                    question: '¿Cuánta agua permanece en el tanque?',
                    tip: 'Compara lo que había con lo que salió.'
                })
            },
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                condition: ({ a, b }) => a >= b,
                template: ({ a, b }) => ({
                    description: `Preparaste ${a} galletas y regalaste ${b} a tus vecinos.`,
                    question: '¿Cuántas galletas te quedaron?',
                    tip: 'Resta las que entregaste de las preparadas.'
                })
            }
        ],
        division: [
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                condition: ({ b }) => b !== 0,
                template: ({ a, b }) => ({
                    description: `Tienes ${a} caramelos y deseas repartirlos en partes iguales entre ${b} amigos.`,
                    question: '¿Cuántos caramelos recibe cada persona?',
                    tip: 'Divide la cantidad total entre el número de personas.'
                })
            },
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                condition: ({ b }) => b !== 0,
                template: ({ a, b }) => ({
                    description: `Un viaje de ${a} km se completa en ${b} horas.` ,
                    question: '¿Cuál fue la velocidad promedio en km por hora?',
                    tip: 'Divide la distancia entre el tiempo.'
                })
            },
            {
                supports: ['N', 'Z'],
                requirePositive: true,
                condition: ({ b }) => b !== 0,
                template: ({ a, b }) => ({
                    description: `Dispones de ${a} adhesivos y deseas guardarlos en paquetes de ${b} unidades.`,
                    question: '¿Cuántos paquetes completos puedes formar?',
                    tip: 'Divide la cantidad total entre la capacidad de cada paquete.'
                })
            }
        ]
    },

    extractNumericValue: (value) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (value && typeof value === 'object' && typeof value.num === 'number' && typeof value.den === 'number' && value.den !== 0) {
            return value.num / value.den;
        }
        return null;
    },

    buildContextualScenario: (problem, solution) => {
        const bank = ModuleManager.contextualScenarioBank[ModuleManager.currentModule];
        if (!bank) return null;

        const a = ModuleManager.extractNumericValue(problem.a);
        const b = ModuleManager.extractNumericValue(problem.b);
        const result = typeof solution.result === 'number' ? solution.result : null;

        if (a === null || b === null) {
            return null;
        }

        const eligible = bank.filter((entry) => {
            if (entry.supports && !entry.supports.includes(problem.type)) return false;
            if (entry.requirePositive && (a <= 0 || b <= 0)) return false;
            if (entry.condition && !entry.condition({ a, b, result })) return false;
            return true;
        });

        if (!eligible.length) return null;
        const pick = eligible[MathCore.randomInt(0, eligible.length - 1)];
        return pick.template({ a, b, result });
    },

    init: () => {
        // Render initial structure if needed, or bind events
        ModuleManager.bindEvents();
    },

    bindEvents: () => {
        // Tab switching
        document.querySelectorAll('.module-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target.dataset.tab;
                ModuleManager.switchTab(target);
            });
        });
    },

    switchModule: (moduleName) => {
        ModuleManager.currentModule = moduleName;

        // Integration with global UI
        if (typeof UI !== 'undefined') {
            UI.resetViews();
            if (typeof UI.resetScrollPosition === 'function') {
                UI.resetScrollPosition();
            }
            let menuName = '';
            if (moduleName === 'multiplication') menuName = 'multiplicar';
            else if (moduleName === 'division') menuName = 'dividir';
            else if (moduleName === 'addition') menuName = 'sumar';
            else if (moduleName === 'subtraction') menuName = 'restar';
            else if (moduleName === 'sets') menuName = 'conjuntos';
            
            UI.updateActiveMenu(menuName);
            
            // Ocultar título global ya que el módulo tiene el suyo propio
            if (typeof DOM !== 'undefined' && DOM.text && DOM.text.titulo) {
                UI.toggleElement(DOM.text.titulo, false);
            }

            // Update global state mode to prevent conflicts
            if (typeof state !== 'undefined') {
                state.mode = moduleName;
            }
        }

        // Show Module Container and apply theme
        const container = document.getElementById('module-container');
        if (container) {
            UI.toggleElement(container, true);
            container.setAttribute('data-module-theme', moduleName);
        }

        // Update UI Title
        let title = '';
        if (moduleName === 'multiplication') title = 'Módulo de Multiplicación';
        else if (moduleName === 'division') title = 'Módulo de División';
        else if (moduleName === 'addition') title = 'Módulo de Suma';
        else if (moduleName === 'subtraction') title = 'Módulo de Resta';
        else if (moduleName === 'sets') title = 'Módulo de Conjuntos';

        document.getElementById('module-title').textContent = title;
        
        // Reset Views
        ModuleManager.switchTab('explicacion');
        ModuleManager.renderExplanation();
    },

    switchTab: (tabName) => {
        ModuleManager.currentTab = tabName;
        
        // Update Tab UI
        document.querySelectorAll('.module-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.module-tab[data-tab="${tabName}"]`).classList.add('active');

        // Hide all content sections
        document.querySelectorAll('.module-section').forEach(section => UI.toggleElement(section, false));
        
        // Show target section
        const targetSection = document.getElementById(`section-${tabName}`);
        if (targetSection) UI.toggleElement(targetSection, true);

        // Render specific content
        if (tabName === 'explicacion') ModuleManager.renderExplanation();
        if (tabName === 'generador') ModuleManager.renderGenerator();
        if (tabName === 'practica') ModuleManager.renderPractice();
        if (tabName === 'talleres') ModuleManager.renderWorkshops();
        if (tabName === 'examen') ModuleManager.renderExamSetup();

        if (typeof UI !== 'undefined' && typeof UI.persistViewState === 'function') {
            UI.persistViewState({ type: 'module', module: ModuleManager.currentModule, tab: ModuleManager.currentTab });
        }
    },

    // ==========================================
    // 1. Explicación
    // ==========================================
    renderExplanation: () => {
        const container = document.getElementById('explanation-content');
        const mod = ModuleManager.currentModule;
        
        if (mod === 'sets') {
            ModuleManager.renderSetsExplanation(container);
            return;
        }

        let title = '';
        let opSymbol = '';
        
        if (mod === 'multiplication') { title = 'La Multiplicación'; opSymbol = '×'; }
        else if (mod === 'division') { title = 'La División'; opSymbol = '÷'; }
        else if (mod === 'addition') { title = 'La Suma'; opSymbol = '+'; }
        else if (mod === 'subtraction') { title = 'La Resta'; opSymbol = '-'; }
        
        let html = `
            <div class="explanation-block">
                <h3>${title} en los Conjuntos Numéricos</h3>
                <p>Exploraremos cómo funciona esta operación en diferentes tipos de números.</p>
            </div>
        `;

        const types = [
            { code: 'N', name: 'Naturales (N)', desc: 'Números que usamos para contar (0, 1, 2...)' },
            { code: 'Z', name: 'Enteros (Z)', desc: 'Incluye los negativos (..., -2, -1, 0, 1...)' },
            { code: 'Q', name: 'Racionales (Q)', desc: 'Fracciones y decimales (1/2, 0.5...)' }
        ];

        types.forEach(type => {
            html += `
                <div class="number-type-block">
                    <h4>${type.name}</h4>
                    <p>${type.desc}</p>
                    <div class="examples-grid">
            `;
            
            // Generate 2 dynamic examples
            for(let i=0; i<2; i++) {
                const problem = MathCore.generateOperation(ModuleManager.currentModule, type.code, 1);
                const solution = MathCore.solve(problem);
                
                html += `
                    <div class="example-card">
                        <div class="problem">
                            ${MathCore.formatNumber(problem.a, type.code)} 
                            ${opSymbol} 
                            ${MathCore.formatNumber(problem.b, type.code)}
                        </div>
                        <div class="solution">
                            <strong>= ${type.code === 'Q' ? MathCore.formatNumber(solution.result, 'Q') : solution.result}</strong>
                        </div>
                        <div class="steps-mini">
                            ${solution.steps.map(s => `<small>• ${s}</small>`).join('<br>')}
                        </div>
                    </div>
                `;
            }
            
            html += `</div></div>`;
        });

        // Video Placeholder
        html += `
            <div class="video-section">
                <h4>Video Explicativo</h4>
                <div class="video-placeholder">
                    <p>Aquí iría un video de YouTube sobre ${title}</p>
                    <!-- <iframe ... ></iframe> -->
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    // ==========================================
    // 2. Generador
    // ==========================================
    renderGenerator: () => {
        // Setup Generator UI if not already set
        const container = document.getElementById('generator-content');
        
        if (ModuleManager.currentModule === 'sets') {
            // Custom UI for Sets Generator
            const controls = document.querySelector('#section-generador .generator-controls');
            if (controls) {
                controls.innerHTML = `
                    <div class="sets-controls-group">
                        <div class="control-row">
                            <label>Tipo:</label>
                            <select id="gen-set-type">
                                <option value="numbers">Números</option>
                                <option value="letters">Letras</option>
                                <option value="words">Palabras</option>
                                <option value="mixed">Mixto</option>
                            </select>
                        </div>
                        <div class="control-row">
                            <label>Tamaño:</label>
                            <select id="gen-set-size">
                                <option value="3">3 Elementos</option>
                                <option value="5" selected>5 Elementos</option>
                                <option value="8">8 Elementos</option>
                            </select>
                        </div>
                        <div class="control-row">
                            <label>Cantidad:</label>
                            <select id="gen-set-count" onchange="ModuleManager.updateSetInputs()">
                                <option value="1">1 Conjunto (A)</option>
                                <option value="2">2 Conjuntos (A, B)</option>
                                <option value="3">3 Conjuntos (A, B, C)</option>
                            </select>
                        </div>
                    </div>
                    <div id="manual-sets-inputs" class="manual-sets-inputs">
                        <!-- Inputs injected here -->
                    </div>
                    <div class="sets-actions">
                        <button class="action-btn" onclick="ModuleManager.generateSingle()">🎲 Generar Aleatorio</button>
                        <button class="action-btn btn-info" onclick="ModuleManager.verifyAndGraphSets()">📊 Verificar y Graficar</button>
                    </div>
                `;
                ModuleManager.updateSetInputs();
            }
            // Hide result/steps buttons as they might not be relevant or need adaptation
            document.querySelector('.gen-actions').classList.add('u-hidden');
            return;
        }

        // Default UI for other modules (restore if needed)
        const controls = document.querySelector('#section-generador .generator-controls');
        if (controls && !document.getElementById('gen-type')) {
             controls.innerHTML = `
                <select id="gen-type">
                    <option value="N">Naturales (N)</option>
                    <option value="Z">Enteros (Z)</option>
                    <option value="Q">Racionales (Q)</option>
                </select>
                <select id="gen-diff">
                    <option value="1">Nivel 1</option>
                    <option value="2">Nivel 2</option>
                    <option value="3">Nivel 3</option>
                </select>
                <button class="action-btn" onclick="ModuleManager.generateSingle()">Generar</button>
            `;
            document.querySelector('.gen-actions').classList.remove('u-hidden');
        }
    },

    generateSingle: () => {
        if (ModuleManager.currentModule === 'sets') {
            const type = document.getElementById('gen-set-type').value;
            const size = parseInt(document.getElementById('gen-set-size').value);
            const count = parseInt(document.getElementById('gen-set-count').value);
            
            const display = document.getElementById('gen-display');
            let html = '<div class="gen-problem" style="text-align: left; display: inline-block;">';
            
            const labels = ['A', 'B', 'C'];
            const sets = [];

            // Pick a category for all sets if type is words to ensure relevance
            let category = null;
            if (type === 'words') {
                const keys = Object.keys(MathCore.categories);
                category = keys[MathCore.randomInt(0, keys.length - 1)];
                html += `<div style="margin-bottom: 1rem; color: var(--color-accent-dark); font-weight: bold;">Tema: ${category.charAt(0).toUpperCase() + category.slice(1)}</div>`;
            }
            
            for(let i=0; i<count; i++) {
                const set = MathCore.generateRandomSet(type, size, category);
                sets.push(set);
                html += `
                    <div style="margin-bottom: 1rem;">
                        <span style="font-size: 1.5rem; color: var(--color-text-muted);">${labels[i]} = </span>
                        <strong style="font-size: 2rem; color: var(--color-primary);">{ ${set.join(', ')} }</strong>
                    </div>
                `;
            }

            // Calculate Intersections if count > 1
            if (count >= 2) {
                html += '<div class="sets-intersections" style="margin-top: 2rem; border-top: 1px solid var(--color-border); padding-top: 1rem;">';
                html += '<h4 style="color: var(--color-text-muted); margin-bottom: 1rem;">Intersecciones:</h4>';
                
                // A ∩ B
                const AnB = MathCore.solveSetOperation(sets[0], sets[1], 'intersection').result;
                html += `
                    <div style="margin-bottom: 0.5rem;">
                        <span style="font-weight: bold;">A ∩ B = </span>
                        <span>{ ${AnB.length ? AnB.join(', ') : '∅'} }</span>
                    </div>
                `;

                if (count === 3) {
                    // A ∩ C
                    const AnC = MathCore.solveSetOperation(sets[0], sets[2], 'intersection').result;
                    html += `
                        <div style="margin-bottom: 0.5rem;">
                            <span style="font-weight: bold;">A ∩ C = </span>
                            <span>{ ${AnC.length ? AnC.join(', ') : '∅'} }</span>
                        </div>
                    `;

                    // B ∩ C
                    const BnC = MathCore.solveSetOperation(sets[1], sets[2], 'intersection').result;
                    html += `
                        <div style="margin-bottom: 0.5rem;">
                            <span style="font-weight: bold;">B ∩ C = </span>
                            <span>{ ${BnC.length ? BnC.join(', ') : '∅'} }</span>
                        </div>
                    `;

                    // A ∩ B ∩ C
                    const AnBnC = MathCore.solveSetOperation(AnB, sets[2], 'intersection').result;
                    html += `
                        <div style="margin-bottom: 0.5rem;">
                            <span style="font-weight: bold;">A ∩ B ∩ C = </span>
                            <span>{ ${AnBnC.length ? AnBnC.join(', ') : '∅'} }</span>
                        </div>
                    `;
                }
                html += '</div>';
            }

            html += '</div>';
            display.innerHTML = html;
            return;
        }

        const type = document.getElementById('gen-type').value;
        const diff = parseInt(document.getElementById('gen-diff').value);
        const problem = MathCore.generateOperation(ModuleManager.currentModule, type, diff);
        const solution = MathCore.solve(problem);

        const display = document.getElementById('gen-display');
        const steps = document.getElementById('gen-steps');

        let opSymbol = '';
        if (ModuleManager.currentModule === 'multiplication') opSymbol = '×';
        else if (ModuleManager.currentModule === 'division') opSymbol = '÷';
        else if (ModuleManager.currentModule === 'addition') opSymbol = '+';
        else if (ModuleManager.currentModule === 'subtraction') opSymbol = '-';
        
        display.innerHTML = `
            <div class="gen-problem">
                ${MathCore.formatNumber(problem.a, type)} ${opSymbol} ${MathCore.formatNumber(problem.b, type)}
            </div>
            <div class="gen-result u-hidden" id="gen-result-val">
                = ${type === 'Q' ? MathCore.formatNumber(solution.result, 'Q') : solution.result}
            </div>
        `;

        steps.innerHTML = solution.steps.map(s => `<div class="step-item">${s}</div>`).join('');
        steps.classList.add('u-hidden');
        
        // Reset buttons
        document.getElementById('btn-show-result').classList.remove('u-hidden');
        document.getElementById('btn-show-steps').classList.add('u-hidden');
    },

    showGenResult: () => {
        document.getElementById('gen-result-val').classList.remove('u-hidden');
        document.getElementById('btn-show-result').classList.add('u-hidden');
        document.getElementById('btn-show-steps').classList.remove('u-hidden');
    },

    showGenSteps: () => {
        document.getElementById('gen-steps').classList.remove('u-hidden');
        document.getElementById('btn-show-steps').classList.add('u-hidden');
    },

    // ==========================================
    // 3. Práctica Dinámica
    // ==========================================
    renderPractice: () => {
        // Iniciar nueva sesión de práctica
        ModuleManager.state.practice = {
            isActive: true,
            currentQuestionIndex: 0,
            totalQuestions: 5,
            questions: [],
            results: [],
            score: 0
        };

        if (ModuleManager.currentModule === 'sets') {
            ModuleManager.newSetPracticeQuestion();
        } else {
            ModuleManager.newPracticeQuestion();
        }
    },

    newPracticeQuestion: () => {
        const { practice } = ModuleManager.state;
        
        // Verificar si terminamos
        if (practice.currentQuestionIndex >= practice.totalQuestions) {
            ModuleManager.showPracticeReport();
            return;
        }

        // Randomize type and difficulty
        const types = ['N', 'Z', 'Q'];
        const type = types[MathCore.randomInt(0, 2)];
        const diff = MathCore.randomInt(1, 2);
        
        const problem = MathCore.generateOperation(ModuleManager.currentModule, type, diff);
        const solution = MathCore.solve(problem);
        const scenario = ModuleManager.buildContextualScenario(problem, solution);
        const scenarioHtml = scenario ? `
            <div class="practice-context">
                <p>${scenario.description}</p>
                <p class="practice-context__question">${scenario.question}</p>
                ${scenario.tip ? `<p class="practice-context__tip">Pista: ${scenario.tip}</p>` : ''}
            </div>
        ` : '';
        
        // Guardar pregunta actual
        practice.questions.push({ problem, solution });
        
        const container = document.getElementById('practice-area');
        let opSymbol = '';
        if (ModuleManager.currentModule === 'multiplication') opSymbol = '×';
        else if (ModuleManager.currentModule === 'division') opSymbol = '÷';
        else if (ModuleManager.currentModule === 'addition') opSymbol = '+';
        else if (ModuleManager.currentModule === 'subtraction') opSymbol = '-';

        container.innerHTML = `
            <div class="practice-card">
                <div class="practice-header">
                    <span>Ejercicio ${practice.currentQuestionIndex + 1} de ${practice.totalQuestions}</span>
                </div>
                ${scenarioHtml}
                <div class="practice-problem">
                    ${MathCore.formatNumber(problem.a, type)} ${opSymbol} ${MathCore.formatNumber(problem.b, type)}
                </div>
                <div class="practice-input-group">
                    <input type="text" id="practice-answer" placeholder="Tu respuesta" autocomplete="off">
                    <button class="action-btn" onclick="ModuleManager.checkPractice()">Comprobar</button>
                </div>
                <div id="practice-feedback" class="feedback-msg"></div>
            </div>
        `;
        
        // Focus input
        setTimeout(() => document.getElementById('practice-answer').focus(), 100);
    },

    checkPractice: () => {
        const inputEl = document.getElementById('practice-answer');
        const input = inputEl.value.trim();
        if (!input) return; // No permitir vacío
        
        const { practice } = ModuleManager.state;
        const currentQ = practice.questions[practice.currentQuestionIndex];
        const correct = currentQ.solution.result;
        const type = currentQ.problem.type;
        
        let isCorrect = false;
        
        if (type === 'Q') {
            const correctStr = `${correct.num}/${correct.den}`;
            isCorrect = input === correctStr;
        } else {
            isCorrect = parseFloat(input) == parseFloat(correct);
        }

        // Guardar resultado
        practice.results.push({
            questionIndex: practice.currentQuestionIndex,
            userAnswer: input,
            isCorrect: isCorrect,
            correctAnswer: type === 'Q' ? `${correct.num}/${correct.den}` : correct
        });

        const feedback = document.getElementById('practice-feedback');
        
        if (isCorrect) {
            feedback.textContent = "¡Correcto! 🎉";
            feedback.className = "feedback-msg success";
            window.sounds.playSuccess();
            // Sumar ejercicio completado
            ProfileManager.addProgress(0, 1);
        } else {
            const correctDisplay = type === 'Q' ? `${correct.num}/${correct.den}` : correct;
            feedback.textContent = `Incorrecto. La respuesta era ${correctDisplay}`;
            feedback.className = "feedback-msg error";
            window.sounds.playError();
        }

        // Deshabilitar input
        inputEl.disabled = true;
        document.querySelector('.practice-input-group button').disabled = true;

        // Avanzar
        practice.currentQuestionIndex++;
        setTimeout(ModuleManager.newPracticeQuestion, 2000);
    },

    showPracticeReport: () => {
        const { practice } = ModuleManager.state;
        const container = document.getElementById('practice-area');
        
        const correctCount = practice.results.filter(r => r.isCorrect).length;
        const grade = (correctCount / practice.totalQuestions) * 5;
        
        // Premio por puntaje perfecto
        if (grade === 5) {
            setTimeout(() => {
                ProfileManager.addTrophy();
                if (window.confetti) {
                    window.confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            }, 500);
        }
        
        let statusClass = '';
        if (grade < 3.5) statusClass = 'score-bad';
        else if (grade < 4.5) statusClass = 'score-good';
        else statusClass = 'score-excellent';

        let html = `
            <div class="exam-results">
                <h3>Reporte de Práctica</h3>
                <div class="score-display ${statusClass}">
                    Nota Final: ${grade.toFixed(1)} / 5.0
                </div>
                <p>Has respondido correctamente ${correctCount} de ${practice.totalQuestions} ejercicios.</p>
                
                <div class="review-list">
        `;

        practice.results.forEach((res, i) => {
            const q = practice.questions[i];
            let opSymbol = '';
            if (ModuleManager.currentModule === 'multiplication') opSymbol = '×';
            else if (ModuleManager.currentModule === 'division') opSymbol = '÷';
            else if (ModuleManager.currentModule === 'addition') opSymbol = '+';
            else if (ModuleManager.currentModule === 'subtraction') opSymbol = '-';

            const type = q.problem.type;
            
            html += `
                <div class="review-item ${res.isCorrect ? 'correct' : 'incorrect'}">
                    <div class="review-q">
                        ${i+1}. ${MathCore.formatNumber(q.problem.a, type)} ${opSymbol} ${MathCore.formatNumber(q.problem.b, type)}
                    </div>
                    <div class="review-a">
                        Tu respuesta: <strong>${res.userAnswer}</strong>
                        ${!res.isCorrect ? `<br>Correcta: <strong>${res.correctAnswer}</strong>` : ''}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <button class="action-btn" onclick="ModuleManager.renderPractice()">Nueva Práctica</button>
            </div>
        `;
        
        container.innerHTML = html;
    },

    updatePracticeScore: (grade) => {
        // Deprecated in favor of session report
    },

    // ==========================================
    // 4. Talleres
    // ==========================================
    renderWorkshops: () => {
        const container = document.getElementById('section-talleres');
        
        let controlsHtml = '';
        if (ModuleManager.currentModule === 'sets') {
            controlsHtml = `
                <select id="ws-type">
                    <option value="mixed">Mixto (Números/Letras/Palabras)</option>
                    <option value="numbers">Números</option>
                    <option value="letters">Letras</option>
                    <option value="words">Palabras (Temático)</option>
                </select>
                <select id="ws-diff">
                    <option value="2">2 Conjuntos (A, B)</option>
                    <option value="3">3 Conjuntos (A, B, C)</option>
                </select>
            `;
        } else {
            controlsHtml = `
                <select id="ws-type">
                    <option value="ALL">Todos (N, Z, Q)</option>
                    <option value="N">Naturales (N)</option>
                    <option value="Z">Enteros (Z)</option>
                    <option value="Q">Racionales (Q)</option>
                </select>
                <select id="ws-diff">
                    <option value="1">Nivel 1 (Básico)</option>
                    <option value="2">Nivel 2 (Intermedio)</option>
                    <option value="3">Nivel 3 (Avanzado)</option>
                </select>
            `;
        }

        container.innerHTML = `
            <div class="workshop-setup">
                <h3>Generador de Talleres</h3>
                <p>Crea una lista de ejercicios para resolver en tu cuaderno.</p>
                <div class="generator-controls">
                    ${controlsHtml}
                    <button class="action-btn" onclick="ModuleManager.generateWorkshop()">Generar Taller</button>
                </div>
                <div id="workshop-output" class="workshop-grid u-hidden"></div>
            </div>
        `;
    },

    generateWorkshop: () => {
        const typeSel = document.getElementById('ws-type').value;
        const diff = parseInt(document.getElementById('ws-diff').value);
        const container = document.getElementById('workshop-output');
        
        let html = '<h4>Ejercicios Propuestos</h4><div class="workshop-list">';
        
        if (ModuleManager.currentModule === 'sets') {
            // Sets Workshop Generation
            for(let i=0; i<5; i++) { // 5 exercises for sets as they are larger
                const numSets = diff; // 2 or 3 sets
                const setType = typeSel === 'mixed' ? 
                    ['numbers', 'letters', 'words'][MathCore.randomInt(0, 2)] : typeSel;
                
                let category = null;
                let categoryTitle = '';
                if (setType === 'words') {
                    const keys = Object.keys(MathCore.categories);
                    category = keys[MathCore.randomInt(0, keys.length - 1)];
                    categoryTitle = `(Tema: ${category.charAt(0).toUpperCase() + category.slice(1)})`;
                }

                const setA = MathCore.generateRandomSet(setType, 5, category);
                const setB = MathCore.generateRandomSet(setType, 5, category);
                const setC = numSets === 3 ? MathCore.generateRandomSet(setType, 5, category) : null;

                const ops = ['union', 'intersection', 'difference_a_b', 'difference_b_a'];
                const op = ops[MathCore.randomInt(0, 3)];
                
                let opSymbol = '';
                if (op === 'union') opSymbol = '∪';
                else if (op === 'intersection') opSymbol = '∩';
                else if (op === 'difference_a_b') opSymbol = '-';
                else if (op === 'difference_b_a') opSymbol = '-'; // Special handling for display

                let question = '';
                if (numSets === 2) {
                    if (op === 'difference_b_a') question = 'B - A';
                    else if (op === 'difference_a_b') question = 'A - B';
                    else question = `A ${opSymbol} B`;
                } else {
                    // For 3 sets, generate a slightly more complex question or just A op B
                    // Let's keep it simple for workshop: A op B, or A op C
                    const target2 = Math.random() > 0.5 ? 'C' : 'B';
                    question = `A ${opSymbol} ${target2}`;
                    if (Math.random() > 0.7) question = `(A ${opSymbol} B) ${opSymbol === '∪' ? '∩' : '∪'} C`; // Mix it up rarely
                }

                html += `
                    <div class="ws-item sets-ws-item">
                        <span class="ws-number">${i+1}.</span>
                        <div class="ws-sets-content">
                            ${categoryTitle ? `<div class="ws-sets-theme">${categoryTitle}</div>` : ''}
                            <div class="ws-sets-data">
                                <span><strong>A</strong> = {${setA.join(', ')}}</span>
                                <span><strong>B</strong> = {${setB.join(', ')}}</span>
                                ${setC ? `<span><strong>C</strong> = {${setC.join(', ')}}</span>` : ''}
                            </div>
                            <div class="ws-sets-question">
                                Hallar: <strong>${question}</strong> = { __________________ }
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            // Arithmetic Workshop Generation
            for(let i=0; i<10; i++) {
                let type = typeSel;
                if (type === 'ALL') {
                    const types = ['N', 'Z', 'Q'];
                    type = types[MathCore.randomInt(0, 2)];
                }
                
                const problem = MathCore.generateOperation(ModuleManager.currentModule, type, diff);
                let opSymbol = '';
                if (ModuleManager.currentModule === 'multiplication') opSymbol = '×';
                else if (ModuleManager.currentModule === 'division') opSymbol = '÷';
                else if (ModuleManager.currentModule === 'addition') opSymbol = '+';
                else if (ModuleManager.currentModule === 'subtraction') opSymbol = '-';
                
                html += `
                    <div class="ws-item">
                        <span class="ws-number">${i+1}.</span>
                        ${MathCore.formatNumber(problem.a, type)} ${opSymbol} ${MathCore.formatNumber(problem.b, type)} = ______
                    </div>
                `;
            }
        }
        
        html += '</div><button class="action-btn btn-secondary" onclick="window.print()">Imprimir / Guardar PDF</button>';
        
        container.innerHTML = html;
        container.classList.remove('u-hidden');
    },

    // ==========================================
    // 5. Examen
    // ==========================================
    renderExamSetup: () => {
        const container = document.getElementById('exam-content');
        if (ModuleManager.state.exam.attempts >= ModuleManager.state.exam.maxAttempts) {
            container.innerHTML = `
                <div class="exam-setup">
                    <h3>Has agotado tus intentos</h3>
                    <p>Ya has realizado el examen 2 veces.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="exam-setup">
                <h3>Configuración del Examen</h3>
                <div class="form-group">
                    <label>Cantidad de Preguntas:</label>
                    <select id="exam-count">
                        <option value="5">5 Preguntas</option>
                        <option value="10" selected>10 Preguntas</option>
                        <option value="20">20 Preguntas</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tiempo Límite:</label>
                    <select id="exam-time">
                        <option value="0">Sin Límite</option>
                        <option value="5">5 Minutos</option>
                        <option value="15">15 Minutos</option>
                        <option value="30">30 Minutos</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Nivel de Dificultad:</label>
                    <select id="exam-diff">
                        <option value="MIXED">Mixto (1-3)</option>
                        <option value="1">Nivel 1 (Básico)</option>
                        <option value="2">Nivel 2 (Intermedio)</option>
                        <option value="3">Nivel 3 (Avanzado)</option>
                    </select>
                </div>
                <button class="action-btn" onclick="ModuleManager.startExam()">Iniciar Examen</button>
            </div>
        `;
    },

    startExam: () => {
        const count = parseInt(document.getElementById('exam-count').value);
        const time = parseInt(document.getElementById('exam-time').value);
        const diffVal = document.getElementById('exam-diff').value;
        
        ModuleManager.state.exam.config = { count, timeLimit: time, difficulty: diffVal };
        ModuleManager.state.exam.questions = [];
        ModuleManager.state.exam.answers = new Array(count).fill(null);
        ModuleManager.state.exam.isActive = true;
        ModuleManager.state.exam.submitted = false;
        ModuleManager.state.exam.currentQuestionIndex = 0; // Reset index
        ModuleManager.state.exam.timeLeft = time > 0 ? time * 60 : 0;
        ModuleManager.stopExamTimer();

        // Generate Questions
        for(let i=0; i<count; i++) {
            let problem, solution;

            if (ModuleManager.currentModule === 'sets') {
                const setA = MathCore.generateSet(4, 1, 10);
                const setB = MathCore.generateSet(4, 5, 15);
                const ops = ['union', 'intersection', 'difference_a_b', 'difference_b_a'];
                const op = ops[MathCore.randomInt(0, 3)];
                problem = { setA, setB, op, type: 'sets' };
                solution = MathCore.solveSetOperation(setA, setB, op);
            } else {
                const types = ['N', 'Z', 'Q'];
                const type = types[MathCore.randomInt(0, 2)];
                
                let diff;
                if (diffVal === 'MIXED') {
                    diff = MathCore.randomInt(1, 3);
                } else {
                    diff = parseInt(diffVal);
                }

                problem = MathCore.generateOperation(ModuleManager.currentModule, type, diff);
                solution = MathCore.solve(problem);
            }

            ModuleManager.state.exam.questions.push({
                id: i,
                problem,
                solution
            });
        }

        ModuleManager.renderExamInterface();
        ModuleManager.startExamTimer();
    },

    renderExamInterface: () => {
        const container = document.getElementById('exam-content');
        const { questions, answers, currentQuestionIndex } = ModuleManager.state.exam;
        
        // Estructura del Layout
        let html = `
            <div class="exam-container">
                <!-- Sidebar de Navegación -->
                <aside class="exam-sidebar" id="exam-sidebar">
                    <div class="exam-sidebar-header">
                        <h4>Preguntas</h4>
                        <button class="close-sidebar-btn" onclick="ModuleManager.toggleExamSidebar()">✕</button>
                    </div>
                    <div class="question-grid">
                        ${questions.map((_, i) => {
                            const isAnswered = answers[i] !== null && answers[i] !== '';
                            const isActive = i === currentQuestionIndex;
                            return `
                                <div class="q-nav-btn ${isActive ? 'active' : ''} ${isAnswered ? 'answered' : ''}" 
                                     onclick="ModuleManager.jumpToQuestion(${i})">
                                    ${i + 1}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </aside>

                <!-- Área Principal -->
                <main class="exam-main">
                    <div class="exam-toolbar">
                        <button class="toggle-sidebar-btn" onclick="ModuleManager.toggleExamSidebar()">
                            ☰
                        </button>
                        <span class="exam-timer" id="exam-timer">Tiempo: --:--</span>
                    </div>

                    <div class="exam-question-area" id="current-question-area">
                        <!-- El contenido de la pregunta se renderiza aquí -->
                    </div>

                    <div class="exam-footer">
                        <div class="nav-controls">
                            <button class="nav-btn nav-btn-prev" onclick="ModuleManager.prevQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>
                                ← Anterior
                            </button>
                            <button class="nav-btn nav-btn-next" onclick="ModuleManager.nextQuestion()">
                                ${currentQuestionIndex === questions.length - 1 ? 'Finalizar' : 'Siguiente →'}
                            </button>
                        </div>
                        <div class="progress-info">
                            ${answers.filter(a => a).length} / ${questions.length} Respondidas
                        </div>
                    </div>
                </main>
            </div>
        `;

        container.innerHTML = html;
        ModuleManager.renderCurrentQuestion();
        ModuleManager.updateExamTimerDisplay();
    },

    startExamTimer: () => {
        const examState = ModuleManager.state.exam;
        const timeLimit = examState.config.timeLimit;

        // Always refresh UI text even if there is no limit
        ModuleManager.updateExamTimerDisplay();

        if (!examState.isActive || !timeLimit || timeLimit <= 0) {
            return;
        }

        if (examState.timerInterval) {
            return; // Timer already running
        }

        if (!examState.timeLeft || examState.timeLeft <= 0) {
            examState.timeLeft = timeLimit * 60;
        }

        examState.timerInterval = setInterval(() => {
            examState.timeLeft = Math.max(0, examState.timeLeft - 1);
            ModuleManager.updateExamTimerDisplay();

            if (examState.timeLeft === 0) {
                ModuleManager.stopExamTimer();
                if (window.notifications && typeof window.notifications.show === 'function') {
                    window.notifications.show('El tiempo ha finalizado. Enviando examen...', 'warning');
                }
                ModuleManager.submitExam(true);
            }
        }, 1000);
    },

    stopExamTimer: () => {
        const examState = ModuleManager.state.exam;
        if (examState.timerInterval) {
            clearInterval(examState.timerInterval);
            examState.timerInterval = null;
        }
    },

    updateExamTimerDisplay: () => {
        const timerEl = document.getElementById('exam-timer');
        if (!timerEl) return;

        const examState = ModuleManager.state.exam;
        const timeLimit = examState.config.timeLimit;

        if (!examState.isActive) {
            timerEl.textContent = 'Tiempo: --:--';
            return;
        }

        if (!timeLimit || timeLimit <= 0) {
            timerEl.textContent = 'Tiempo: Sin límite';
            return;
        }

        const totalSeconds = Math.max(0, examState.timeLeft);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');

        timerEl.textContent = `Tiempo: ${minutes}:${seconds}`;
    },

    renderCurrentQuestion: () => {
        const { questions, answers, currentQuestionIndex } = ModuleManager.state.exam;
        const q = questions[currentQuestionIndex];
        const val = answers[currentQuestionIndex] || '';
        const area = document.getElementById('current-question-area');

        if (q.problem.type === 'sets') {
            const { setA, setB, op } = q.problem;
            let opTitle = '';
            if (op === 'union') opTitle = 'A ∪ B';
            else if (op === 'intersection') opTitle = 'A ∩ B';
            else if (op === 'difference_a_b') opTitle = 'A - B';
            else if (op === 'difference_b_a') opTitle = 'B - A';

            area.innerHTML = `
                <div class="current-q-number">Pregunta ${currentQuestionIndex + 1}</div>
                <div class="sets-display" style="font-size: 1.5rem;">
                    <p><strong>A</strong> = {${setA.join(', ')}}</p>
                    <p><strong>B</strong> = {${setB.join(', ')}}</p>
                </div>
                <div class="current-q-text" style="font-size: 2.5rem; margin-bottom: 1rem;">
                    ${opTitle}
                </div>
                <input type="text" class="exam-input-large" 
                       value="${val}" 
                       oninput="ModuleManager.saveExamAnswer(${currentQuestionIndex}, this.value)"
                       placeholder="Ej: 1, 2, 3" autofocus>
            `;
        } else {
            let opSymbol = '';
            if (ModuleManager.currentModule === 'multiplication') opSymbol = '×';
            else if (ModuleManager.currentModule === 'division') opSymbol = '÷';
            else if (ModuleManager.currentModule === 'addition') opSymbol = '+';
            else if (ModuleManager.currentModule === 'subtraction') opSymbol = '-';

            const type = q.problem.type;
            area.innerHTML = `
                <div class="current-q-number">Pregunta ${currentQuestionIndex + 1}</div>
                <div class="current-q-text">
                    ${MathCore.formatNumber(q.problem.a, type)} ${opSymbol} ${MathCore.formatNumber(q.problem.b, type)}
                </div>
                <input type="text" class="exam-input-large" 
                       value="${val}" 
                       oninput="ModuleManager.saveExamAnswer(${currentQuestionIndex}, this.value)"
                       placeholder="?" autofocus>
            `;
        }
        
        // Focus input
        setTimeout(() => {
            const input = area.querySelector('input');
            if(input) input.focus();
        }, 50);
    },

    toggleExamSidebar: () => {
        const sidebar = document.getElementById('exam-sidebar');
        sidebar.classList.toggle('hidden');
    },

    jumpToQuestion: (index) => {
        ModuleManager.state.exam.currentQuestionIndex = index;
        ModuleManager.renderExamInterface(); // Re-render full interface to update sidebar active state
    },

    prevQuestion: () => {
        if (ModuleManager.state.exam.currentQuestionIndex > 0) {
            ModuleManager.state.exam.currentQuestionIndex--;
            ModuleManager.renderExamInterface();
        }
    },

    nextQuestion: () => {
        const { currentQuestionIndex, questions } = ModuleManager.state.exam;
        if (currentQuestionIndex < questions.length - 1) {
            ModuleManager.state.exam.currentQuestionIndex++;
            ModuleManager.renderExamInterface();
        } else {
            ModuleManager.submitExam();
        }
    },

    saveExamAnswer: (index, value) => {
        ModuleManager.state.exam.answers[index] = value;
        // Update sidebar status visually without full re-render if possible, or just let it be
        // For now, let's update the specific nav button class
        const navBtns = document.querySelectorAll('.q-nav-btn');
        if (navBtns[index]) {
            if (value) navBtns[index].classList.add('answered');
            else navBtns[index].classList.remove('answered');
        }
        
        // Update progress text
        const answeredCount = ModuleManager.state.exam.answers.filter(a => a).length;
        const progressEl = document.querySelector('.progress-info');
        if (progressEl) progressEl.textContent = `${answeredCount} / ${ModuleManager.state.exam.questions.length} Respondidas`;
    },

    submitExam: (autoSubmit = false) => {
        if(!autoSubmit && !confirm('¿Estás seguro de enviar el examen? Podrás revisar tus respuestas.')) return;
        
        ModuleManager.state.exam.isActive = false;
        ModuleManager.state.exam.submitted = true;
        ModuleManager.state.exam.attempts++;
        ModuleManager.stopExamTimer();
        
        // Grading
        let correctCount = 0;
        const { questions, answers } = ModuleManager.state.exam;
        
        questions.forEach((q, i) => {
            const input = (answers[i] || '').trim();
            const correct = q.solution.result;
            const type = q.problem.type;
            
            let isCorrect = false;
            if (type === 'sets') {
                // Parse user input for sets
                const userNums = input.split(',')
                    .map(s => parseInt(s.trim()))
                    .filter(n => !isNaN(n))
                    .sort((a, b) => a - b);
                isCorrect = JSON.stringify(userNums) === JSON.stringify(correct);
            } else if (type === 'Q') {
                isCorrect = input === `${correct.num}/${correct.den}`;
            } else {
                isCorrect = parseFloat(input) == parseFloat(correct);
            }
            
            q.isCorrect = isCorrect;
            if(isCorrect) {
                correctCount++;
                ProfileManager.addProgress(0, 1);
            }
        });

        // Calculate Grade (0-5)
        const grade = (correctCount / questions.length) * 5;
        
        if (grade === 5) {
            ProfileManager.addProgress(1, 0);
            setTimeout(() => {
                window.notifications.show('¡Examen Perfecto! +1 Estrella ⭐', 'success');
                if (window.confetti) {
                    window.confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 }
                    });
                }
            }, 500);
        }
        
        ModuleManager.renderExamResults(grade, correctCount);
    },

    renderExamResults: (grade, correctCount = 0) => {
        const container = document.getElementById('exam-content');
        let status = '';
        let statusClass = '';
        
        if (grade < 3.5) { status = 'Reprobado'; statusClass = 'score-bad'; }
        else if (grade < 4.5) { status = 'Aprobado (Bueno)'; statusClass = 'score-good'; }
        else { status = 'Aprobado (Excelente)'; statusClass = 'score-excellent'; }

        const totalQuestions = ModuleManager.state.exam.questions.length;
        if (window.ProfileManager && typeof ProfileManager.addHistoryEntry === 'function') {
            ProfileManager.addHistoryEntry('exam', {
                module: ModuleManager.currentModule,
                score: correctCount,
                totalQuestions,
                grade,
                meta: {
                    timeLimit: ModuleManager.state.exam.config.timeLimit,
                    submittedAt: new Date().toISOString()
                }
            });
        }

        let html = `
            <div class="exam-results">
                <h3>Resultados del Examen</h3>
                <div class="score-display ${statusClass}">
                    Nota: ${grade.toFixed(1)} - ${status}
                </div>
                <div class="review-list">
        `;

        const { questions, answers } = ModuleManager.state.exam;
        questions.forEach((q, i) => {
            let questionText = '';
            let correctVal = '';

            if (q.problem.type === 'sets') {
                const { op } = q.problem;
                let opTitle = '';
                if (op === 'union') opTitle = 'A ∪ B';
                else if (op === 'intersection') opTitle = 'A ∩ B';
                else if (op === 'difference_a_b') opTitle = 'A - B';
                else if (op === 'difference_b_a') opTitle = 'B - A';
                
                questionText = `${i+1}. ${opTitle}`;
                correctVal = `{${q.solution.result.join(', ')}}`;
            } else {
                let opSymbol = '';
                if (ModuleManager.currentModule === 'multiplication') opSymbol = '×';
                else if (ModuleManager.currentModule === 'division') opSymbol = '÷';
                else if (ModuleManager.currentModule === 'addition') opSymbol = '+';
                else if (ModuleManager.currentModule === 'subtraction') opSymbol = '-';
                
                const type = q.problem.type;
                questionText = `${i+1}. ${MathCore.formatNumber(q.problem.a, type)} ${opSymbol} ${MathCore.formatNumber(q.problem.b, type)}`;
                correctVal = type === 'Q' ? `${q.solution.result.num}/${q.solution.result.den}` : q.solution.result;
            }
            
            html += `
                <div class="review-item ${q.isCorrect ? 'correct' : 'incorrect'}">
                    <div class="review-q">
                        ${questionText}
                    </div>
                    <div class="review-a">
                        Tu respuesta: <strong>${answers[i] || 'Vacío'}</strong>
                        ${!q.isCorrect ? `<br>Correcta: <strong>${correctVal}</strong>` : ''}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <button class="action-btn" onclick="ModuleManager.renderExamSetup()">Volver / Reintentar</button>
            </div>
        `;
        
        container.innerHTML = html;
    },

    // ==========================================
    // 6. Módulo de Conjuntos (Sets)
    // ==========================================
    renderSetsExplanation: (container) => {
        container.innerHTML = `
            <div class="explanation-block">
                <h3>Teoría de Conjuntos y Diagramas de Venn</h3>
                <p>Un <strong>conjunto</strong> es una colección bien definida de objetos, llamados elementos. Los conjuntos se nombran con letras mayúsculas (A, B, C) y sus elementos se escriben entre llaves { }.</p>
                
                <div class="concept-box">
                    <h4>Conceptos Básicos</h4>
                    <ul>
                        <li><strong>Pertenencia (∈):</strong> Si un elemento está en un conjunto. Ej: 1 ∈ {1, 2, 3}</li>
                        <li><strong>Cardinalidad (|A|):</strong> Es el número de elementos que tiene un conjunto.</li>
                        <li><strong>Conjunto Vacío (∅):</strong> Es un conjunto que no tiene elementos.</li>
                        <li><strong>Subconjunto (⊆):</strong> A es subconjunto de B si todos los elementos de A están en B.</li>
                    </ul>
                </div>
            </div>
            
            <h3 style="margin-top: 2rem; margin-bottom: 1rem; color: var(--color-primary);">Operaciones entre Conjuntos</h3>
            
            <div class="sets-grid">
                <!-- UNIÓN -->
                <div class="set-card">
                    <h4>Unión (A ∪ B)</h4>
                    <p>La unión agrupa <strong>todos</strong> los elementos de ambos conjuntos. Es como "sumar" los conjuntos sin repetir elementos.</p>
                    <div class="set-example">
                        <small>Ejemplo:</small><br>
                        A = {1, 2}<br>
                        B = {2, 3}<br>
                        <strong>A ∪ B = {1, 2, 3}</strong>
                    </div>
                    <svg viewBox="0 0 200 120" class="venn-svg">
                        <circle cx="70" cy="60" r="40" class="venn-circle set-a filled" />
                        <circle cx="130" cy="60" r="40" class="venn-circle set-b filled" />
                        <text x="60" y="65" class="venn-label">A</text>
                        <text x="140" y="65" class="venn-label">B</text>
                    </svg>
                </div>

                <!-- INTERSECCIÓN -->
                <div class="set-card">
                    <h4>Intersección (A ∩ B)</h4>
                    <p>La intersección son los elementos <strong>comunes</strong>, es decir, los que están en A <strong>Y</strong> también en B.</p>
                    <div class="set-example">
                        <small>Ejemplo:</small><br>
                        A = {1, 2, 3}<br>
                        B = {2, 3, 4}<br>
                        <strong>A ∩ B = {2, 3}</strong>
                    </div>
                    <svg viewBox="0 0 200 120" class="venn-svg">
                        <defs>
                            <clipPath id="clip-intersection">
                                <circle cx="70" cy="60" r="40" />
                            </clipPath>
                        </defs>
                        <circle cx="70" cy="60" r="40" class="venn-circle set-a" />
                        <circle cx="130" cy="60" r="40" class="venn-circle set-b" clip-path="url(#clip-intersection)" class="filled" style="fill: var(--color-accent); opacity: 0.6;" />
                        <text x="60" y="65" class="venn-label">A</text>
                        <text x="140" y="65" class="venn-label">B</text>
                    </svg>
                </div>

                <!-- DIFERENCIA -->
                <div class="set-card">
                    <h4>Diferencia (A - B)</h4>
                    <p>Son los elementos que pertenecen a A pero <strong>NO</strong> pertenecen a B. Es como "restarle" B a A.</p>
                    <div class="set-example">
                        <small>Ejemplo:</small><br>
                        A = {1, 2, 3}<br>
                        B = {2, 3, 4}<br>
                        <strong>A - B = {1}</strong>
                    </div>
                    <svg viewBox="0 0 200 120" class="venn-svg">
                        <defs>
                            <mask id="mask-diff-a-b">
                                <rect x="0" y="0" width="200" height="120" fill="white" />
                                <circle cx="130" cy="60" r="40" fill="black" />
                            </mask>
                        </defs>
                        <circle cx="70" cy="60" r="40" class="venn-circle set-a filled" mask="url(#mask-diff-a-b)" />
                        <circle cx="130" cy="60" r="40" class="venn-circle set-b" />
                        <text x="60" y="65" class="venn-label">A</text>
                        <text x="140" y="65" class="venn-label">B</text>
                    </svg>
                </div>

                <!-- DIFERENCIA SIMÉTRICA -->
                <div class="set-card">
                    <h4>Diferencia Simétrica (A Δ B)</h4>
                    <p>Son los elementos que están en A o en B, pero <strong>NO en ambos</strong>. Es la unión menos la intersección.</p>
                    <div class="set-example">
                        <small>Ejemplo:</small><br>
                        A = {1, 2, 3}<br>
                        B = {2, 3, 4}<br>
                        <strong>A Δ B = {1, 4}</strong>
                    </div>
                    <svg viewBox="0 0 200 120" class="venn-svg">
                        <defs>
                            <mask id="mask-sym-diff">
                                <rect x="0" y="0" width="200" height="120" fill="white" />
                                <circle cx="100" cy="60" r="30" fill="black" /> <!-- Approximate intersection mask -->
                            </mask>
                            <!-- Better approach for symmetric difference visual -->
                            <clipPath id="clip-sym-a">
                                <circle cx="70" cy="60" r="40" />
                            </clipPath>
                            <clipPath id="clip-sym-b">
                                <circle cx="130" cy="60" r="40" />
                            </clipPath>
                        </defs>
                        <!-- A only -->
                        <circle cx="70" cy="60" r="40" class="venn-circle set-a filled" mask="url(#mask-diff-a-b)" />
                        <!-- B only (using similar mask logic reversed) -->
                         <mask id="mask-diff-b-a">
                                <rect x="0" y="0" width="200" height="120" fill="white" />
                                <circle cx="70" cy="60" r="40" fill="black" />
                        </mask>
                        <circle cx="130" cy="60" r="40" class="venn-circle set-b filled" style="fill: var(--color-accent); opacity: 0.2;" mask="url(#mask-diff-b-a)" />
                        
                        <circle cx="70" cy="60" r="40" class="venn-circle set-a" fill="none" />
                        <circle cx="130" cy="60" r="40" class="venn-circle set-b" fill="none" />
                        
                        <text x="60" y="65" class="venn-label">A</text>
                        <text x="140" y="65" class="venn-label">B</text>
                    </svg>
                </div>
            </div>
        `;
    },

    renderSetsPractice: () => {
        // Override default practice for sets
        if (ModuleManager.currentModule === 'sets') {
            ModuleManager.newSetPracticeQuestion();
            return;
        }
        // ... existing logic for other modules ...
    },

    newSetPracticeQuestion: () => {
        const { practice } = ModuleManager.state;
        
        if (practice.currentQuestionIndex >= practice.totalQuestions) {
            ModuleManager.showPracticeReport();
            return;
        }

        // Randomly decide type: numbers or words (50/50 chance)
        const useWords = Math.random() > 0.5;
        let setA, setB, categoryName = '';

        if (useWords) {
            // Pick a random category
            const keys = Object.keys(MathCore.categories);
            const category = keys[MathCore.randomInt(0, keys.length - 1)];
            categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            
            // Generate sets from that category
            setA = MathCore.generateRandomSet('words', 4, category);
            setB = MathCore.generateRandomSet('words', 4, category);
        } else {
            // Default number generation
            setA = MathCore.generateSet(4, 1, 10);
            setB = MathCore.generateSet(4, 5, 15);
        }
        
        const ops = ['union', 'intersection', 'difference_a_b', 'difference_b_a'];
        const op = ops[MathCore.randomInt(0, 3)];
        
        const solution = MathCore.solveSetOperation(setA, setB, op);
        
        practice.questions.push({ 
            problem: { setA, setB, op, type: 'sets', category: categoryName }, 
            solution 
        });

        const container = document.getElementById('practice-area');
        
        let opTitle = '';
        if (op === 'union') opTitle = 'A ∪ B';
        else if (op === 'intersection') opTitle = 'A ∩ B';
        else if (op === 'difference_a_b') opTitle = 'A - B';
        else if (op === 'difference_b_a') opTitle = 'B - A';

        container.innerHTML = `
            <div class="practice-card">
                <div class="practice-header">
                    <span>Ejercicio ${practice.currentQuestionIndex + 1} de ${practice.totalQuestions}</span>
                </div>
                <div class="sets-problem">
                    ${categoryName ? `<p style="color: var(--color-accent-dark); font-weight: bold; margin-bottom: 0.5rem;">Tema: ${categoryName}</p>` : ''}
                    <div class="sets-display">
                        <p><strong>A</strong> = {${setA.join(', ')}}</p>
                        <p><strong>B</strong> = {${setB.join(', ')}}</p>
                    </div>
                    <div class="sets-question">
                        Calcula: <strong>${opTitle}</strong>
                    </div>
                    <p class="hint-text">Ingresa los elementos separados por comas (ej: ${useWords ? 'Perro, Gato' : '1, 2, 3'})</p>
                </div>
                <div class="practice-input-group">
                    <input type="text" id="practice-answer" placeholder="Respuesta..." autocomplete="off">
                    <button class="action-btn" onclick="ModuleManager.checkSetPractice()">Comprobar</button>
                </div>
                <div id="practice-feedback" class="feedback-msg"></div>
            </div>
        `;
    },

    checkSetPractice: () => {
        const inputEl = document.getElementById('practice-answer');
        const input = inputEl.value.trim();
        if (!input && input !== '') return; // Allow empty set if applicable, but usually not empty input
        
        const { practice } = ModuleManager.state;
        const currentQ = practice.questions[practice.currentQuestionIndex];
        const correctSet = currentQ.solution.result;
        
        // Parse user input
        const userNums = input.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
        
        // Compare sets
        const isCorrect = JSON.stringify(userNums) === JSON.stringify(correctSet);

        practice.results.push({
            questionIndex: practice.currentQuestionIndex,
            userAnswer: `{${userNums.join(', ')}}`,
            isCorrect: isCorrect,
            correctAnswer: `{${correctSet.join(', ')}}`
        });

        const feedback = document.getElementById('practice-feedback');
        
        if (isCorrect) {
            feedback.textContent = "¡Correcto! 🎉";
            feedback.className = "feedback-msg success";
            window.sounds.playSuccess();
            ProfileManager.addProgress(0, 1);
        } else {
            feedback.textContent = `Incorrecto. La respuesta era {${correctSet.join(', ')}}`;
            feedback.className = "feedback-msg error";
            window.sounds.playError();
        }

        inputEl.disabled = true;
        document.querySelector('.practice-input-group button').disabled = true;

        practice.currentQuestionIndex++;
        setTimeout(ModuleManager.newSetPracticeQuestion, 3000);
    },

    updateSetInputs: () => {
        const count = parseInt(document.getElementById('gen-set-count').value);
        const container = document.getElementById('manual-sets-inputs');
        const labels = ['A', 'B', 'C'];
        let html = '';
        
        for(let i=0; i<count; i++) {
            html += `
                <div class="set-input-group">
                    <label>Conjunto ${labels[i]}:</label>
                    <input type="text" id="set-input-${i}" placeholder="Ej: 1, 2, 3, 4" class="set-text-input">
                </div>
            `;
        }
        container.innerHTML = html;
    },

    verifyAndGraphSets: () => {
        const count = parseInt(document.getElementById('gen-set-count').value);
        const sets = [];
        const labels = ['A', 'B', 'C'];
        
        // Read inputs
        for(let i=0; i<count; i++) {
            const val = document.getElementById(`set-input-${i}`).value;
            const items = val.split(',').map(s => s.trim()).filter(s => s !== '');
            // Try to parse numbers if possible, else keep strings
            const parsedItems = items.map(item => isNaN(item) ? item : Number(item));
            // Unique items
            sets.push([...new Set(parsedItems)].sort((a, b) => (typeof a === 'number' && typeof b === 'number') ? a - b : String(a).localeCompare(String(b))));
        }

        const display = document.getElementById('gen-display');
        let html = '<div class="sets-analysis">';

        // 1. Show Sets
        html += '<div class="sets-list">';
        sets.forEach((set, i) => {
            html += `<div class="set-display-item"><strong>${labels[i]}</strong> = { ${set.join(', ')} }</div>`;
        });
        html += '</div>';

        // 2. Calculate Intersections
        html += '<div class="sets-intersections-list">';
        html += '<h4>Intersecciones Calculadas:</h4>';
        
        if (count >= 2) {
            const AnB = MathCore.solveSetOperation(sets[0], sets[1], 'intersection').result;
            html += `<div>A ∩ B = { ${AnB.length ? AnB.join(', ') : '∅'} }</div>`;
            
            if (count === 3) {
                const AnC = MathCore.solveSetOperation(sets[0], sets[2], 'intersection').result;
                const BnC = MathCore.solveSetOperation(sets[1], sets[2], 'intersection').result;
                const AnBnC = MathCore.solveSetOperation(AnB, sets[2], 'intersection').result;
                
                html += `<div>A ∩ C = { ${AnC.length ? AnC.join(', ') : '∅'} }</div>`;
                html += `<div>B ∩ C = { ${BnC.length ? BnC.join(', ') : '∅'} }</div>`;
                html += `<div>A ∩ B ∩ C = { ${AnBnC.length ? AnBnC.join(', ') : '∅'} }</div>`;
            }
        } else {
            html += '<div>Se necesitan al menos 2 conjuntos para intersecciones.</div>';
        }
        html += '</div>';

        // 3. Graph Venn Diagram
        html += '<div class="venn-graph-container">';
        html += ModuleManager.generateVennSVG(sets, count);
        html += '</div>';

        html += '</div>';
        display.innerHTML = html;
    },

    generateVennSVG: (sets, count) => {
        if (count === 1) {
            return `
                <svg viewBox="0 0 300 200" class="venn-svg-large">
                    <circle cx="150" cy="100" r="80" class="venn-circle set-a" />
                    <text x="150" y="100" text-anchor="middle" class="venn-text">${sets[0].join('\n')}</text>
                    <text x="150" y="190" text-anchor="middle" class="venn-label-large">A</text>
                </svg>
            `;
        } else if (count === 2) {
            // Calculate regions
            const A = sets[0];
            const B = sets[1];
            const AnB = MathCore.solveSetOperation(A, B, 'intersection').result;
            const Aonly = MathCore.solveSetOperation(A, B, 'difference_a_b').result;
            const Bonly = MathCore.solveSetOperation(B, A, 'difference_b_a').result;

            return `
                <svg viewBox="0 0 400 250" class="venn-svg-large">
                    <circle cx="140" cy="125" r="90" class="venn-circle set-a" />
                    <circle cx="260" cy="125" r="90" class="venn-circle set-b" />
                    
                    <!-- Labels -->
                    <text x="100" y="40" class="venn-label-large" fill="var(--color-primary)">A</text>
                    <text x="300" y="40" class="venn-label-large" fill="var(--color-accent)">B</text>

                    <!-- Content -->
                    <foreignObject x="60" y="85" width="80" height="80">
                        <div class="venn-content">${Aonly.join(', ')}</div>
                    </foreignObject>
                    
                    <foreignObject x="180" y="85" width="40" height="80">
                        <div class="venn-content center">${AnB.join(', ')}</div>
                    </foreignObject>
                    
                    <foreignObject x="260" y="85" width="80" height="80">
                        <div class="venn-content">${Bonly.join(', ')}</div>
                    </foreignObject>
                </svg>
            `;
        } else if (count === 3) {
            const A = sets[0];
            const B = sets[1];
            const C = sets[2];

            // Intersections
            const AnB = MathCore.solveSetOperation(A, B, 'intersection').result;
            const AnC = MathCore.solveSetOperation(A, C, 'intersection').result;
            const BnC = MathCore.solveSetOperation(B, C, 'intersection').result;
            const AnBnC = MathCore.solveSetOperation(AnB, C, 'intersection').result;

            // Exclusive Regions
            // A only = A - (B U C)
            const B_U_C = MathCore.solveSetOperation(B, C, 'union').result;
            const Aonly = MathCore.solveSetOperation(A, B_U_C, 'difference_a_b').result;

            // B only = B - (A U C)
            const A_U_C = MathCore.solveSetOperation(A, C, 'union').result;
            const Bonly = MathCore.solveSetOperation(B, A_U_C, 'difference_a_b').result;

            // C only = C - (A U B)
            const A_U_B = MathCore.solveSetOperation(A, B, 'union').result;
            const Conly = MathCore.solveSetOperation(C, A_U_B, 'difference_a_b').result;

            // Pairwise Exclusive (e.g. A n B only = (A n B) - C)
            const AnB_only = MathCore.solveSetOperation(AnB, C, 'difference_a_b').result;
            const AnC_only = MathCore.solveSetOperation(AnC, B, 'difference_a_b').result;
            const BnC_only = MathCore.solveSetOperation(BnC, A, 'difference_a_b').result;

            return `
                <svg viewBox="0 0 400 400" class="venn-svg-large">
                    <!-- Circles -->
                    <circle cx="200" cy="140" r="90" class="venn-circle set-a" style="opacity: 0.6" />
                    <circle cx="140" cy="240" r="90" class="venn-circle set-b" style="opacity: 0.6" />
                    <circle cx="260" cy="240" r="90" class="venn-circle set-c" style="opacity: 0.6; stroke: var(--color-success);" />

                    <!-- Labels -->
                    <text x="200" y="40" class="venn-label-large">A</text>
                    <text x="60" y="240" class="venn-label-large">B</text>
                    <text x="340" y="240" class="venn-label-large">C</text>

                    <!-- A only (Top) -->
                    <foreignObject x="170" y="80" width="60" height="50">
                        <div class="venn-content small">${Aonly.join(', ')}</div>
                    </foreignObject>

                    <!-- B only (Left Bottom) -->
                    <foreignObject x="90" y="220" width="60" height="50">
                        <div class="venn-content small">${Bonly.join(', ')}</div>
                    </foreignObject>

                    <!-- C only (Right Bottom) -->
                    <foreignObject x="250" y="220" width="60" height="50">
                        <div class="venn-content small">${Conly.join(', ')}</div>
                    </foreignObject>

                    <!-- A n B only (Left Top Intersection) -->
                    <foreignObject x="130" y="160" width="50" height="40">
                        <div class="venn-content small">${AnB_only.join(', ')}</div>
                    </foreignObject>

                    <!-- A n C only (Right Top Intersection) -->
                    <foreignObject x="220" y="160" width="50" height="40">
                        <div class="venn-content small">${AnC_only.join(', ')}</div>
                    </foreignObject>

                    <!-- B n C only (Bottom Intersection) -->
                    <foreignObject x="175" y="270" width="50" height="40">
                        <div class="venn-content small">${BnC_only.join(', ')}</div>
                    </foreignObject>

                    <!-- Center (A n B n C) -->
                    <foreignObject x="180" y="200" width="40" height="40">
                        <div class="venn-content small bold">${AnBnC.join(', ')}</div>
                    </foreignObject>
                </svg>
            `;
        }
    },
};

// Initialize
document.addEventListener('DOMContentLoaded', ModuleManager.init);
