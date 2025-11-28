/**
 * Profile Manager
 * Handles user profile, avatar, and stats.
 */
const ProfileManager = {
    data: {
        name: 'Explorador',
        avatar: '🦁',
        level: 1,
        stars: 0,
        trophies: 0,
        exercisesCompleted: 0,
        badges: []
    },

    init: () => {
        ProfileManager.loadData();
        ProfileManager.renderProfile();
    },

    loadData: () => {
        const saved = localStorage.getItem('userProfile');
        if (saved) {
            ProfileManager.data = JSON.parse(saved);
        } else {
            // Default data already set
            // Try to get username from auth if available
            const authUser = localStorage.getItem('username');
            if (authUser) ProfileManager.data.name = authUser;
        }
    },

    saveData: () => {
        localStorage.setItem('userProfile', JSON.stringify(ProfileManager.data));
        ProfileManager.renderProfile(); // Update UI
    },

    renderProfile: () => {
        const { name, avatar, level, stars, trophies, exercisesCompleted } = ProfileManager.data;
        
        // Update Header
        const avatarEl = document.getElementById('profile-avatar');
        const nameEl = document.getElementById('profile-name');
        const levelEl = document.getElementById('profile-level');
        
        if(avatarEl) avatarEl.textContent = avatar;
        if(nameEl) nameEl.textContent = name;
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
            let menuName = '';
            if (moduleName === 'multiplication') menuName = 'multiplicar';
            else if (moduleName === 'division') menuName = 'dividir';
            else if (moduleName === 'addition') menuName = 'sumar';
            else if (moduleName === 'subtraction') menuName = 'restar';
            
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

        // Show Module Container
        const container = document.getElementById('module-container');
        if (container) container.classList.remove('u-hidden');

        // Update UI Title
        let title = '';
        if (moduleName === 'multiplication') title = 'Módulo de Multiplicación';
        else if (moduleName === 'division') title = 'Módulo de División';
        else if (moduleName === 'addition') title = 'Módulo de Suma';
        else if (moduleName === 'subtraction') title = 'Módulo de Resta';

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
        document.querySelectorAll('.module-section').forEach(s => s.classList.add('u-hidden'));
        
        // Show target section
        const targetSection = document.getElementById(`section-${tabName}`);
        if (targetSection) targetSection.classList.remove('u-hidden');

        // Render specific content
        if (tabName === 'explicacion') ModuleManager.renderExplanation();
        if (tabName === 'generador') ModuleManager.renderGenerator();
        if (tabName === 'practica') ModuleManager.renderPractice();
        if (tabName === 'talleres') ModuleManager.renderWorkshops();
        if (tabName === 'examen') ModuleManager.renderExamSetup();
    },

    // ==========================================
    // 1. Explicación
    // ==========================================
    renderExplanation: () => {
        const container = document.getElementById('explanation-content');
        const mod = ModuleManager.currentModule;
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
        // We assume the HTML structure exists, we just bind logic
        // But for this refactor, let's inject the controls dynamically to ensure they match
    },

    generateSingle: () => {
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
        ModuleManager.newPracticeQuestion();
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
        container.innerHTML = `
            <div class="workshop-setup">
                <h3>Generador de Talleres</h3>
                <p>Crea una lista de ejercicios para resolver en tu cuaderno.</p>
                <div class="generator-controls">
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

        // Generate Questions
        for(let i=0; i<count; i++) {
            const types = ['N', 'Z', 'Q'];
            const type = types[MathCore.randomInt(0, 2)];
            
            let diff;
            if (diffVal === 'MIXED') {
                diff = MathCore.randomInt(1, 3);
            } else {
                diff = parseInt(diffVal);
            }

            const problem = MathCore.generateOperation(ModuleManager.currentModule, type, diff);
            ModuleManager.state.exam.questions.push({
                id: i,
                problem,
                solution: MathCore.solve(problem)
            });
        }

        ModuleManager.renderExamInterface();
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
    },

    renderCurrentQuestion: () => {
        const { questions, answers, currentQuestionIndex } = ModuleManager.state.exam;
        const q = questions[currentQuestionIndex];
        let opSymbol = '';
        if (ModuleManager.currentModule === 'multiplication') opSymbol = '×';
        else if (ModuleManager.currentModule === 'division') opSymbol = '÷';
        else if (ModuleManager.currentModule === 'addition') opSymbol = '+';
        else if (ModuleManager.currentModule === 'subtraction') opSymbol = '-';

        const type = q.problem.type;
        const val = answers[currentQuestionIndex] || '';

        const area = document.getElementById('current-question-area');
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

    submitExam: () => {
        if(!confirm('¿Estás seguro de enviar el examen? Podrás revisar tus respuestas.')) return;
        
        ModuleManager.state.exam.isActive = false;
        ModuleManager.state.exam.submitted = true;
        ModuleManager.state.exam.attempts++;
        
        // Grading
        let correctCount = 0;
        const { questions, answers } = ModuleManager.state.exam;
        
        questions.forEach((q, i) => {
            const input = (answers[i] || '').trim();
            const correct = q.solution.result;
            const type = q.problem.type;
            
            let isCorrect = false;
            if (type === 'Q') {
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
        
        ModuleManager.renderExamResults(grade);
    },

    renderExamResults: (grade) => {
        const container = document.getElementById('exam-content');
        let status = '';
        let statusClass = '';
        
        if (grade < 3.5) { status = 'Reprobado'; statusClass = 'score-bad'; }
        else if (grade < 4.5) { status = 'Aprobado (Bueno)'; statusClass = 'score-good'; }
        else { status = 'Aprobado (Excelente)'; statusClass = 'score-excellent'; }

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
            let opSymbol = '';
            if (ModuleManager.currentModule === 'multiplication') opSymbol = '×';
            else if (ModuleManager.currentModule === 'division') opSymbol = '÷';
            else if (ModuleManager.currentModule === 'addition') opSymbol = '+';
            else if (ModuleManager.currentModule === 'subtraction') opSymbol = '-';

            const type = q.problem.type;
            const correctVal = type === 'Q' ? `${q.solution.result.num}/${q.solution.result.den}` : q.solution.result;
            
            html += `
                <div class="review-item ${q.isCorrect ? 'correct' : 'incorrect'}">
                    <div class="review-q">
                        ${i+1}. ${MathCore.formatNumber(q.problem.a, type)} ${opSymbol} ${MathCore.formatNumber(q.problem.b, type)}
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
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', ModuleManager.init);
