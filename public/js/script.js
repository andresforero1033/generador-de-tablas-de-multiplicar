/**
 * Estado Global de la Aplicación
 * Centraliza el manejo de datos para evitar variables globales dispersas.
 */
const state = {
    mode: 'multiplicar',
    calculator: {
        currentValue: '0',
        pendingOperator: null,
        previousValue: null,
        resetDisplay: false
    },
    math: {
        division: { dividendo: 0, divisor: 0 },
        multiplication: { factor1: 0, factor2: 0 },
        difficulty: {
            division: 1,
            multiplication: 1
        }
    }
};

/**
 * Caché de Elementos del DOM
 * Mejora el rendimiento al evitar consultas repetitivas al documento.
 */
const $ = (id) => document.getElementById(id);

const DOM = {
    menus: {
        multiplicar: $('menu-multiplicar'),
        multiplicarGen: $('menu-multiplicar-gen'),
        dividir: $('menu-dividir'),
        calculadora: $('menu-calculadora'),
        aprendizaje: $('menu-aprendizaje'),
    },
    submenus: {
        multiplicarGen: $('submenu-multiplicar-gen'),
        dividir: $('submenu-dividir'),
    },
    containers: {
        general: $('controles-generales'),
        calculadora: $('calculadora-container'),
        aprendizaje: $('aprendizaje-menu'),
        explicacion: $('explicacion-container'),
        resultado: $('resultado-container'), // Contenedor padre
        resultadoContent: $('resultado'),
        procesos: $('procesos-container'),
        procesosContent: $('procesos-division'),
    },
    inputs: {
        numero: $('numeroInput'),
        calcDisplay: $('calc-display'),
    },
    buttons: {
        generar: $('btn-generar'),
        explicacion: $('btn-explicacion'),
        verProcesos: $('btn-ver-procesos'),
        mobileMenu: $('mobile-menu-btn'), // Nuevo botón
    },
    text: {
        titulo: $('titulo'),
        explicacionTitulo: $('explicacion-titulo'),
        explicacionContenido: $('contenido-explicacion'),
    }
};

/**
 * Módulo de Lógica Matemática
 * Encapsula la generación de operaciones y pasos.
 */
const MathLogic = {
    generateRandomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    getMultiplicationRange: (level) => {
        switch(level) {
            case 1: return { f1: [2, 9], f2: [2, 9] };
            case 2: return { f1: [10, 99], f2: [2, 9] };
            case 3: return { f1: [100, 999], f2: [10, 99] };
            default: return { f1: [2, 9], f2: [2, 9] };
        }
    },

    getDivisionRange: (level) => {
        switch(level) {
            case 1: return { div: [2, 9], quot: [1, 99] };
            case 2: return { div: [10, 99], quot: [10, 999] };
            case 3: return { div: [100, 999], quot: [100, 9999] };
            default: return { div: [2, 9], quot: [1, 20] };
        }
    },

    generateMultiplicationSteps: (factor1, factor2) => {
        const sF1 = factor1.toString();
        const sF2 = factor2.toString();
        const product = factor1 * factor2;
        const sProduct = product.toString();
        
        const lines = [];
        const width = Math.max(sF1.length, sF2.length + 1, sProduct.length);
        
        lines.push(" ".repeat(width - sF1.length) + `<span class="calc-dividend">${sF1}</span>`);
        lines.push(" ".repeat(width - sF2.length - 1) + "x" + `<span class="calc-divisor">${sF2}</span>`);
        lines.push(" ".repeat(width - Math.max(sF1.length, sF2.length + 1)) + "-".repeat(Math.max(sF1.length, sF2.length + 1)));
        
        if (sF2.length > 1) {
            for (let i = sF2.length - 1; i >= 0; i--) {
                const digit = parseInt(sF2[i]);
                const partialProd = factor1 * digit;
                const sPartial = partialProd.toString();
                const rightPadding = sF2.length - 1 - i;
                const totalPadding = width - sPartial.length - rightPadding;
                
                lines.push(" ".repeat(totalPadding) + `<span class="calc-sub">${sPartial}</span>` + " ".repeat(rightPadding));
            }
            lines.push("-".repeat(width));
        }
        
        lines.push(" ".repeat(width - sProduct.length) + `<span class="calc-final">${sProduct}</span>`);
        return lines.join("\n");
    },

    generateDivisionSteps: (dividendo, divisor) => {
        const sDividendo = dividendo.toString();
        const sDivisor = divisor.toString();
        const d = divisor;
        
        let currentV = "";
        const quotientMap = new Array(sDividendo.length).fill(" ");
        let hasStarted = false;
        const lines = [];
        const prefixLen = sDivisor.length + 1;
        
        for (let i = 0; i < sDividendo.length; i++) {
            currentV += sDividendo[i];
            const val = parseInt(currentV);
            
            if (val >= d) {
                hasStarted = true;
                const digit = Math.floor(val / d);
                const prod = digit * d;
                const rest = val - prod;
                
                quotientMap[i] = digit.toString();
                
                const prodStr = prod.toString();
                const indent = prefixLen + i - prodStr.length + 1;
                
                lines.push(" ".repeat(indent) + `<span class="calc-sub">${prodStr}</span>`);
                lines.push(" ".repeat(indent) + "-".repeat(prodStr.length));
                
                if (i < sDividendo.length - 1) {
                    const nextDigit = sDividendo[i+1];
                    let nextValStr = (rest === 0 ? "" : rest.toString()) + nextDigit;
                    if (nextValStr === "") nextValStr = "0";
                    
                    const nextIndent = prefixLen + (i+1) - nextValStr.length + 1;
                    lines.push(" ".repeat(nextIndent) + `<span class="calc-rest">${nextValStr}</span>`);
                    currentV = rest.toString();
                } else {
                    const restStr = rest.toString();
                    const restIndent = prefixLen + i - restStr.length + 1;
                    lines.push(" ".repeat(restIndent) + `<span class="calc-final">${restStr}</span>`);
                }
            } else {
                if (hasStarted || i === sDividendo.length - 1) {
                    quotientMap[i] = "0";
                }
                
                if (i === sDividendo.length - 1) {
                     const restStr = val.toString();
                     const restIndent = prefixLen + i - restStr.length + 1;
                     lines.push(" ".repeat(restIndent) + `<span class="calc-final">${restStr}</span>`);
                }
            }
        }
        
        const qStr = quotientMap.join("");
        const header = " ".repeat(prefixLen) + `<span class="calc-quotient">${qStr}</span>` + "\n" +
                     " ".repeat(prefixLen) + "-".repeat(sDividendo.length) + "\n" +
                     `<span class="calc-divisor">${sDivisor}</span>` + "|" + `<span class="calc-dividend">${sDividendo}</span>`;
                     
        return header + "\n" + lines.join("\n");
    }
};

/**
 * Módulo de Calculadora
 * Maneja la lógica de negocio de la calculadora.
 */
class Calculator {
    static updateDisplay() {
        DOM.inputs.calcDisplay.value = state.calculator.currentValue;
    }

    static inputNumber(num) {
        const { calculator } = state;
        if (calculator.resetDisplay) {
            calculator.currentValue = num.toString();
            calculator.resetDisplay = false;
        } else {
            if (calculator.currentValue === '0' && num !== '.') {
                calculator.currentValue = num.toString();
            } else {
                if (num === '.' && calculator.currentValue.includes('.')) return;
                calculator.currentValue += num.toString();
            }
        }
        this.updateDisplay();
    }

    static inputOperator(op) {
        const { calculator } = state;
        const value = parseFloat(calculator.currentValue);
        
        if (calculator.previousValue === null) {
            calculator.previousValue = value;
        } else if (calculator.pendingOperator) {
            const result = this.calculate(calculator.previousValue, value, calculator.pendingOperator);
            calculator.currentValue = String(result);
            calculator.previousValue = result;
            this.updateDisplay();
        }
        
        calculator.pendingOperator = op;
        calculator.resetDisplay = true;
    }

    static calculate(a, b, op) {
        switch(op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b !== 0 ? a / b : 'Error';
            default: return b;
        }
    }

    static equals() {
        const { calculator } = state;
        if (calculator.pendingOperator === null || calculator.previousValue === null) return;
        
        const value = parseFloat(calculator.currentValue);
        const result = this.calculate(calculator.previousValue, value, calculator.pendingOperator);
        
        calculator.currentValue = String(result);
        calculator.previousValue = null;
        calculator.pendingOperator = null;
        calculator.resetDisplay = true;
        this.updateDisplay();
    }

    static clear() {
        state.calculator = {
            currentValue: '0',
            pendingOperator: null,
            previousValue: null,
            resetDisplay: false
        };
        this.updateDisplay();
    }

    static backspace() {
        const { calculator } = state;
        if (calculator.currentValue.length > 1) {
            calculator.currentValue = calculator.currentValue.slice(0, -1);
        } else {
            calculator.currentValue = '0';
        }
        this.updateDisplay();
    }
}

/**
 * Módulo de Interfaz de Usuario (UI)
 * Maneja la interacción con el DOM y la navegación.
 */
const UI = {
    toggleElement: (element, show) => {
        if (show) {
            element.classList.remove('u-hidden');
            element.style.display = ''; // Limpiar inline style si existe
        } else {
            element.classList.add('u-hidden');
        }
    },

    toggleSubmenu: (submenuId) => {
        const submenu = DOM.submenus[submenuId];
        if (!submenu) return;
        const isHidden = submenu.classList.contains('u-hidden');
        UI.toggleElement(submenu, isHidden);
    },

    resetViews: () => {
        Object.values(DOM.containers).forEach(el => {
            if (el && el !== DOM.containers.resultadoContent && el !== DOM.containers.procesosContent) {
                UI.toggleElement(el, false);
            }
        });
        // Asegurar que resultado y procesos también se oculten
        UI.toggleElement(DOM.containers.resultado, false);
        UI.toggleElement(DOM.containers.procesos, false);
    },

    updateActiveMenu: (mode) => {
        Object.values(DOM.menus).forEach(btn => btn.classList.remove('active'));
        
        const menuMap = {
            'multiplicar': DOM.menus.multiplicar,
            'multiplicar-gen': DOM.menus.multiplicarGen,
            'dividir': DOM.menus.dividir,
            'calculadora': DOM.menus.calculadora,
            'aprendizaje': DOM.menus.aprendizaje
        };
        
        if (menuMap[mode]) menuMap[mode].classList.add('active');
    },

    changeMode: (mode) => {
        // Manejo de toggles de submenús
        if (mode === 'dividir' && state.mode === 'dividir') {
            UI.toggleSubmenu('dividir');
            return;
        }
        if (mode === 'multiplicar-gen' && state.mode === 'multiplicar-gen') {
            UI.toggleSubmenu('multiplicarGen');
            return;
        }

        state.mode = mode;
        UI.updateActiveMenu(mode);
        
        // Gestión de visibilidad de submenús
        UI.toggleElement(DOM.submenus.dividir, mode === 'dividir');
        UI.toggleElement(DOM.submenus.multiplicarGen, mode === 'multiplicar-gen');

        UI.resetViews();

        // Configuración específica por modo
        switch(mode) {
            case 'multiplicar':
                DOM.text.titulo.textContent = 'Tablas de Multiplicar';
                UI.toggleElement(DOM.containers.general, true);
                DOM.buttons.generar.textContent = 'Generar Tabla';
                UI.toggleElement(DOM.buttons.explicacion, true);
                UI.toggleElement(DOM.inputs.numero, true);
                break;
            case 'multiplicar-gen':
                DOM.text.titulo.textContent = 'Generador de Multiplicaciones';
                UI.toggleElement(DOM.containers.general, true);
                DOM.buttons.generar.textContent = 'Generar Nueva Multiplicación';
                UI.toggleElement(DOM.buttons.explicacion, true);
                UI.toggleElement(DOM.inputs.numero, false);
                App.generate();
                break;
            case 'dividir':
                DOM.text.titulo.textContent = 'Generador de Divisiones';
                UI.toggleElement(DOM.containers.general, true);
                DOM.buttons.generar.textContent = 'Generar Nueva División';
                UI.toggleElement(DOM.buttons.explicacion, true);
                UI.toggleElement(DOM.inputs.numero, false);
                App.generate();
                break;
            case 'calculadora':
                DOM.text.titulo.textContent = 'Calculadora';
                UI.toggleElement(DOM.containers.calculadora, true);
                Calculator.clear();
                break;
            case 'aprendizaje':
                DOM.text.titulo.textContent = 'Materiales de Aprendizaje';
                UI.toggleElement(DOM.containers.aprendizaje, true);
                break;
        }
    },

    showExplanation: (level) => {
        const data = EXPLICACIONES[level];
        if (!data) return;

        UI.toggleElement(DOM.containers.aprendizaje, false);
        UI.toggleElement(DOM.containers.explicacion, true);
        
        DOM.text.explicacionTitulo.textContent = data.titulo;
        DOM.text.explicacionContenido.innerHTML = data.contenido;
    },

    showProcesses: () => {
        const isVisible = !DOM.containers.procesosContent.classList.contains('u-hidden');
        
        if (isVisible) {
            UI.toggleElement(DOM.containers.procesosContent, false);
            DOM.buttons.verProcesos.textContent = 'Ver Procesos';
        } else {
            let steps = "";
            if (state.mode === 'dividir') {
                steps = MathLogic.generateDivisionSteps(state.math.division.dividendo, state.math.division.divisor);
            } else if (state.mode === 'multiplicar-gen') {
                steps = MathLogic.generateMultiplicationSteps(state.math.multiplication.factor1, state.math.multiplication.factor2);
            }
            DOM.containers.procesosContent.innerHTML = steps;
            UI.toggleElement(DOM.containers.procesosContent, true);
            DOM.buttons.verProcesos.textContent = 'Ocultar Procesos';
        }
    }
};

/**
 * Datos de Explicaciones
 */
const EXPLICACIONES = {
    'multiplicar': {
        titulo: "Conceptos Básicos de Multiplicación",
        contenido: `
            <div class="explicacion-step">
                <h4>¿Qué es multiplicar?</h4>
                <p>Multiplicar es lo mismo que sumar varias veces el mismo número. Por ejemplo, 3 x 4 es lo mismo que sumar 3 cuatro veces (3 + 3 + 3 + 3).</p>
            </div>
            <div class="explicacion-step">
                <h4>Trucos para las tablas</h4>
                <ul>
                    <li><strong>Tabla del 1:</strong> Todo número multiplicado por 1 es el mismo número.</li>
                    <li><strong>Tabla del 2:</strong> Son todos los números pares (el doble).</li>
                    <li><strong>Tabla del 5:</strong> Siempre terminan en 0 o 5.</li>
                    <li><strong>Tabla del 10:</strong> Solo agrega un 0 al número.</li>
                </ul>
            </div>
            <div style="margin-top: 2rem; text-align: center;">
                <button class="action-btn" onclick="cambiarModo('multiplicar')">Practicar Tablas</button>
            </div>
        `
    },
    'm1': {
        titulo: "Multiplicación Nivel 1",
        contenido: `
            <div class="explicacion-step"><h4>Multiplicación Básica</h4><p>Practica las tablas básicas. 4 x 3 = 12.</p></div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaMultiplicacion(1)">Practicar Nivel 1</button></div>
        `
    },
    'm2': {
        titulo: "Multiplicación Nivel 2",
        contenido: `
            <div class="explicacion-step"><h4>Multiplicación por 1 Cifra (Llevando)</h4><p>Multiplica unidades, luego decenas y suma lo que llevas.</p></div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaMultiplicacion(2)">Practicar Nivel 2</button></div>
        `
    },
    'm3': {
        titulo: "Multiplicación Nivel 3",
        contenido: `
            <div class="explicacion-step"><h4>Multiplicación por 2 Cifras</h4><p>Multiplica por la unidad, luego por la decena (dejando espacio) y suma.</p></div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaMultiplicacion(3)">Practicar Nivel 3</button></div>
        `
    },
    1: {
        titulo: "División por 1 Cifra",
        contenido: `
            <div class="explicacion-step"><h4>Pasos Básicos</h4><p>1. Tomar cifras. 2. Buscar número. 3. Multiplicar y Restar. 4. Bajar siguiente cifra.</p></div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaDivision(1)">Practicar Nivel 1</button></div>
        `
    },
    2: {
        titulo: "División por 2 Cifras",
        contenido: `
            <div class="explicacion-step"><h4>Estimación</h4><p>Tapa las unidades para estimar cuántas veces cabe el divisor.</p></div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaDivision(2)">Practicar Nivel 2</button></div>
        `
    },
    3: {
        titulo: "División por 3 Cifras",
        contenido: `
            <div class="explicacion-step"><h4>División Grande</h4><p>Tapa dos cifras para estimar. Requiere paciencia y orden.</p></div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaDivision(3)">Practicar Nivel 3</button></div>
        `
    }
};

/**
 * Controlador Principal de la Aplicación
 */
const App = {
    init: () => {
        // Event Listeners Globales
        document.addEventListener('keydown', App.handleKeydown);
        
        // Mobile Menu Toggle
        if (DOM.buttons.mobileMenu) {
            DOM.buttons.mobileMenu.addEventListener('click', () => {
                const sidebar = $('sidebar');
                sidebar.classList.toggle('active');
                DOM.buttons.mobileMenu.classList.toggle('open');
            });
        }

        // Cerrar menú al hacer click en un item (móvil)
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    $('sidebar').classList.remove('active');
                    DOM.buttons.mobileMenu.classList.remove('open');
                }
            });
        });
        
        // Inicializar vista
        // (Opcional: cargar estado previo si existiera persistencia)
    },

    handleKeydown: (e) => {
        if (state.mode === 'calculadora') {
            if ((e.key >= '0' && e.key <= '9') || e.key === '.') Calculator.inputNumber(e.key);
            else if (['+', '-', '*', '/'].includes(e.key)) Calculator.inputOperator(e.key);
            else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); Calculator.equals(); }
            else if (e.key === 'Escape') Calculator.clear();
            else if (e.key === 'Backspace') Calculator.backspace();
        } else if (state.mode === 'multiplicar' && e.key === 'Enter') {
            if (document.activeElement === DOM.inputs.numero) App.generate();
        }
    },

    changeDifficulty: (type, level) => {
        if (type === 'division') state.math.difficulty.division = level;
        if (type === 'multiplication') state.math.difficulty.multiplication = level;
        App.generate();
    },

    goToPractice: (type, level) => {
        App.changeDifficulty(type, level);
        UI.changeMode(type === 'division' ? 'dividir' : 'multiplicar-gen');
    },

    goToExplanation: () => {
        let topic = null;
        if (state.mode === 'multiplicar') topic = 'multiplicar';
        else if (state.mode === 'dividir') topic = state.math.difficulty.division;
        else if (state.mode === 'multiplicar-gen') topic = 'm' + state.math.difficulty.multiplication;
        
        if (topic) {
            UI.changeMode('aprendizaje');
            UI.showExplanation(topic);
        }
    },

    generate: () => {
        // Reset UI de procesos
        UI.toggleElement(DOM.containers.procesos, false);
        UI.toggleElement(DOM.containers.procesosContent, false);
        DOM.buttons.verProcesos.textContent = 'Ver Procesos';

        const { mode } = state;
        let html = '';

        if (mode === 'multiplicar') {
            const num = DOM.inputs.numero.value;
            if (!num) { alert('Por favor ingresa un número'); return; }
            
            html = `<h3>Tabla del ${num}</h3>`;
            for (let i = 1; i <= 10; i++) {
                html += `<div class="fila">${num} x ${i} = <strong>${num * i}</strong></div>`;
            }
            UI.toggleElement(DOM.containers.resultado, true);

        } else if (mode === 'multiplicar-gen') {
            const level = state.math.difficulty.multiplication;
            const range = MathLogic.getMultiplicationRange(level);
            
            const f1 = MathLogic.generateRandomInt(range.f1[0], range.f1[1]);
            const f2 = MathLogic.generateRandomInt(range.f2[0], range.f2[1]);
            
            state.math.multiplication = { factor1: f1, factor2: f2 };
            
            html = `<h3>Multiplicación Aleatoria (Nivel ${level})</h3>`;
            html += `<div class="fila" style="font-size: 1.5rem; padding: 1.5rem 0;">${f1} x ${f2} = <strong>${f1 * f2}</strong></div>`;
            
            UI.toggleElement(DOM.containers.resultado, true);
            UI.toggleElement(DOM.containers.procesos, true);

        } else if (mode === 'dividir') {
            const level = state.math.difficulty.division;
            const range = MathLogic.getDivisionRange(level);
            
            const divisor = MathLogic.generateRandomInt(range.div[0], range.div[1]);
            const cociente = MathLogic.generateRandomInt(range.quot[0], range.quot[1]);
            const dividendo = divisor * cociente;
            
            state.math.division = { dividendo, divisor };
            
            html = `<h3>División Aleatoria (Nivel ${level})</h3>`;
            html += `<div class="fila" style="font-size: 1.5rem; padding: 1.5rem 0;">${dividendo} ÷ ${divisor} = <strong>${cociente}</strong></div>`;
            
            UI.toggleElement(DOM.containers.resultado, true);
            UI.toggleElement(DOM.containers.procesos, true);
        }
        
        DOM.containers.resultadoContent.innerHTML = html;
        UI.toggleElement(DOM.containers.resultadoContent, true);
    }
};

// Inicialización
App.init();

// Funciones Globales (Bridge para onclicks en HTML)
// Nota: Idealmente se usarían event listeners, pero mantenemos compatibilidad con el HTML existente
window.cambiarModo = UI.changeMode;
window.cambiarDificultad = (n) => App.changeDifficulty('division', n);
window.cambiarDificultadMulti = (n) => App.changeDifficulty('multiplication', n);
window.generar = App.generate;
window.irAExplicacion = App.goToExplanation;
window.mostrarProcesos = UI.showProcesses;
window.mostrarExplicacion = UI.showExplanation;
window.irAPracticaDivision = (n) => App.goToPractice('division', n);
window.irAPracticaMultiplicacion = (n) => App.goToPractice('multiplication', n);

// Bridge Calculadora
window.calcNumero = (n) => Calculator.inputNumber(n);
window.calcOperador = (op) => Calculator.inputOperator(op);
window.calcIgual = () => Calculator.equals();
window.calcClear = () => Calculator.clear();
