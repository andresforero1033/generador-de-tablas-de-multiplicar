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
        home: $('menu-home'),
        perfil: $('menu-perfil'),
        sumar: $('menu-sumar'),
        restar: $('menu-restar'),
        multiplicar: $('menu-multiplicar'),
        multiplicarGen: $('menu-multiplicar-gen'),
        dividir: $('menu-dividir'),
        calculadora: $('menu-calculadora'),
        aprendizaje: $('menu-aprendizaje'),
        herramientas: $('menu-herramientas'),
    },
    submenus: {
        multiplicarGen: $('submenu-multiplicar-gen'),
        dividir: $('submenu-dividir'),
    },
    containers: {
        home: $('home-dashboard'),
        perfil: $('perfil-container'),
        general: $('controles-generales'),
        module: $('module-container'), // Nuevo contenedor modular
        calculadora: $('calculadora-container'),
        aprendizaje: $('aprendizaje-menu'),
        herramientas: $('herramientas-menu'),
        temasDivision: $('temas-division'),
        temasMultiplicacion: $('temas-multiplicacion'),
        temasConjuntos: $('temas-conjuntos'), // Nuevo contenedor
        explicacion: $('explicacion-container'),
        sobreNosotros: $('sobre-nosotros-container'),
        servicios: $('servicios-container'),
        blog: $('blog-container'),
        legal: $('legal-container'),
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
        if (!element) return;
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

    showDivisionTopics: () => {
        UI.resetViews();
        UI.toggleElement(DOM.containers.temasDivision, true);
        DOM.text.titulo.textContent = 'Niveles de División';
    },

    showMultiplicationTopics: () => {
        UI.resetViews();
        UI.toggleElement(DOM.containers.temasMultiplicacion, true);
        DOM.text.titulo.textContent = 'Niveles de Multiplicación';
    },

    showSetsTopics: () => {
        UI.resetViews();
        UI.toggleElement(DOM.containers.temasConjuntos, true);
        DOM.text.titulo.textContent = 'Conjuntos Numéricos';
    },

    backToLevels: () => {
        // Determinar a qué menú de niveles volver basado en el contenido actual
        // O simplemente volver al menú principal si es ambiguo, pero intentaremos ser listos
        // Por simplicidad, usaremos una variable de estado temporal o inferencia
        // Mejor aún: ocultamos la explicación y mostramos el menú correspondiente
        
        // Como no guardamos el contexto previo, una solución simple es:
        // Si el título de la explicación contiene "División", volvemos a división
        // Si contiene "Multiplicación", volvemos a multiplicación
        
        const titulo = DOM.text.explicacionTitulo.textContent;
        UI.toggleElement(DOM.containers.explicacion, false);
        
        if (titulo.includes('División')) {
            UI.toggleElement(DOM.containers.temasDivision, true);
            DOM.text.titulo.textContent = 'Niveles de División';
        } else if (titulo.includes('Multiplicación')) {
            UI.toggleElement(DOM.containers.temasMultiplicacion, true);
            DOM.text.titulo.textContent = 'Niveles de Multiplicación';
        } else {
            UI.toggleElement(DOM.containers.temasConjuntos, true);
            DOM.text.titulo.textContent = 'Conjuntos Numéricos';
        }
    },

    updateActiveMenu: (mode) => {
        Object.values(DOM.menus).forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        const menuMap = {
            'home': DOM.menus.home,
            'perfil': DOM.menus.perfil,
            'sumar': DOM.menus.sumar,
            'restar': DOM.menus.restar,
            'multiplicar': DOM.menus.multiplicar,
            'multiplicar-gen': DOM.menus.multiplicarGen,
            'dividir': DOM.menus.dividir,
            'calculadora': DOM.menus.herramientas,
            'generador-tablas': DOM.menus.herramientas,
            'aprendizaje': DOM.menus.aprendizaje,
            'herramientas': DOM.menus.herramientas
        };
        
        if (menuMap[mode]) menuMap[mode].classList.add('active');
    },

    changeMode: (mode) => {
        state.mode = mode;
        UI.updateActiveMenu(mode);

        UI.resetViews();

        // Asegurar que el título global sea visible (por si venimos de un módulo que lo ocultó)
        UI.toggleElement(DOM.text.titulo, true);

        // Configuración específica por modo
        switch(mode) {
            case 'home':
                DOM.text.titulo.textContent = 'Bienvenido a Creative BY Mariana';
                UI.toggleElement(DOM.containers.home, true);
                break;
            case 'perfil':
                DOM.text.titulo.textContent = 'Mi Perfil';
                UI.toggleElement(DOM.containers.perfil, true);
                if(window.ProfileManager) window.ProfileManager.renderProfile();
                break;
            case 'herramientas':
                DOM.text.titulo.textContent = 'Herramientas';
                UI.toggleElement(DOM.containers.herramientas, true);
                break;
            case 'generador-tablas':
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
            case 'sobre-nosotros':
                DOM.text.titulo.textContent = 'Sobre Nosotros';
                UI.toggleElement(DOM.containers.sobreNosotros, true);
                break;
            case 'servicios':
                DOM.text.titulo.textContent = 'Nuestros Servicios';
                UI.toggleElement(DOM.containers.servicios, true);
                break;
            case 'blog':
                DOM.text.titulo.textContent = 'Blog Educativo';
                UI.toggleElement(DOM.containers.blog, true);
                break;
            case 'legal':
                DOM.text.titulo.textContent = 'Información Legal';
                UI.toggleElement(DOM.containers.legal, true);
                break;
        }
    },

    showExplanation: (level) => {
        const data = EXPLICACIONES[level];
        if (!data) return;

        UI.toggleElement(DOM.containers.aprendizaje, false);
        UI.toggleElement(DOM.containers.temasDivision, false);
        UI.toggleElement(DOM.containers.temasMultiplicacion, false); // Ocultar también este
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
                <button class="action-btn" onclick="cambiarModo('generador-tablas')">Practicar Tablas</button>
            </div>
        `
    },
    'm1': {
        titulo: "Multiplicación por 1 Cifra: El Inicio",
        contenido: `
            <div class="explicacion-step">
                <h4>✨ ¡Magia con Números!</h4>
                <p>Aprender a multiplicar es como aprender un truco de magia. Si practicas un poco cada día, verás que es muy fácil.</p>
            </div>
            <div class="explicacion-step">
                <h4>✳️ Paso a Paso</h4>
                <p>Cuando multiplicas por 1 cifra, solo debes seguir un renglón de operaciones.</p>
                <p><strong>✏️ Ejemplo: 243 × 5</strong></p>
                <ul>
                    <li>Multiplicamos 3 × 5 = 15 → escribimos 5 y llevamos 1.</li>
                    <li>Multiplicamos 4 × 5 = 20, más 1 que llevamos → 21 → escribimos 1 y llevamos 2.</li>
                    <li>Multiplicamos 2 × 5 = 10, más 2 → 12.</li>
                </ul>
                <p class="math-example">Resultado: 1 2 1 5</p>
                <p><strong>⭐ Truco:</strong> Empieza siempre por la cifra de la derecha.</p>
            </div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaMultiplicacion(1)">Practicar Nivel 1</button></div>
        `
    },
    'm2': {
        titulo: "Multiplicación por 2 Cifras: Doble Renglón",
        contenido: `
            <div class="explicacion-step">
                <h4>✳️ Dos Renglones</h4>
                <p>Aquí se hacen dos renglones. Cada cifra de abajo multiplica a todas las de arriba.</p>
            </div>
            <div class="explicacion-step">
                <h4>✏️ Ejemplo: 243 × 25</h4>
                <p>1. Primero multiplicamos por el 5 (derecha): <strong>243 × 5 = 1215</strong></p>
                <p>2. Ahora multiplicamos por el 2, pero ojo: Ese 2 vale 20, así que agregamos un cero al final.</p>
                <p><strong>243 × 2 = 486 → escribimos 4860</strong></p>
                <p>3. Sumamos los dos renglones:</p>
                <pre style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 8px; font-family: monospace;">
  1215
+ 4860
------
  6075</pre>
                <p><strong>⭐ Truco:</strong> Cada cifra que avanzas a la izquierda, agrega un cero.</p>
            </div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaMultiplicacion(2)">Practicar Nivel 2</button></div>
        `
    },
    'm3': {
        titulo: "Multiplicación por 3 Cifras: Nivel Experto",
        contenido: `
            <div class="explicacion-step">
                <h4>✳️ Tres Renglones</h4>
                <p>Es igual que la de 2 cifras, pero ahora hacemos tres renglones.</p>
            </div>
            <div class="explicacion-step">
                <h4>✏️ Ejemplo: 132 × 234</h4>
                <p>Multiplicamos con cada cifra del 234 empezando desde la derecha:</p>
                <ul>
                    <li><strong>x4:</strong> 132 × 4 = 528</li>
                    <li><strong>x3:</strong> 132 × 3 = 396 → agregamos un cero → <strong>3960</strong></li>
                    <li><strong>x2:</strong> 132 × 2 = 264 → agregamos dos ceros → <strong>26400</strong></li>
                </ul>
                <p>Luego sumamos todo:</p>
                <pre style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 8px; font-family: monospace;">
    528
   3960
+ 26400
-------
  30888</pre>
            </div>
            <div class="explicacion-step">
                <h4>🎯 Consejos para aprender más rápido</h4>
                <ul>
                    <li>Practica con números pequeños primero.</li>
                    <li>Usa colores para marcar lo que llevas.</li>
                    <li>Revisa tus resultados con una calculadora.</li>
                    <li>¡No te preocupes por equivocarte, todos los genios practican mucho!</li>
                </ul>
            </div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaMultiplicacion(3)">Practicar Nivel 3</button></div>
        `
    },
    'm4': {
        titulo: "Multiplicación con Decimales: Nivel Maestro",
        contenido: `
            <div class="explicacion-step">
                <h4>✨ El Secreto de la Coma</h4>
                <p>Multiplicar con decimales es igual que con enteros. ¡El único truco es saber dónde poner la coma al final!</p>
            </div>
            <div class="explicacion-step">
                <h4>✳️ Pasos Mágicos</h4>
                <ol>
                    <li><strong>Olvida la coma:</strong> Multiplica los números como si fueran enteros normales.</li>
                    <li><strong>Cuenta los decimales:</strong> Cuenta cuántos números hay detrás de la coma en total (entre los dos números).</li>
                    <li><strong>Pon la coma:</strong> En el resultado, cuenta espacios desde la derecha y pon la coma.</li>
                </ol>
            </div>
            <div class="explicacion-step">
                <h4>✏️ Ejemplo: 3.12 × 2.5</h4>
                <p>1. Multiplicamos sin comas: <strong>312 × 25 = 7800</strong></p>
                <p>2. Contamos decimales:</p>
                <ul>
                    <li>3.<strong>12</strong> (tiene 2 decimales)</li>
                    <li>2.<strong>5</strong> (tiene 1 decimal)</li>
                    <li>Total: <strong>3 decimales</strong></li>
                </ul>
                <p>3. Ponemos la coma en el 7800 contando 3 lugares desde la derecha:</p>
                <p class="math-example">7 . 8 0 0</p>
                <p><strong>Resultado: 7.8</strong></p>
            </div>
        `
    },
    'N': {
        titulo: "Números Naturales (N)",
        contenido: `
            <div class="explicacion-step">
                <h4>¿Qué son?</h4>
                <p>Son los números que usamos para contar cosas: 0, 1, 2, 3, 4, 5...</p>
                <p>Se representan con la letra <strong>N</strong>.</p>
            </div>
            <div class="explicacion-step">
                <h4>Operaciones</h4>
                <p>Con ellos podemos sumar, restar (si el primero es mayor), multiplicar y dividir.</p>
            </div>
        `
    },
    'Z': {
        titulo: "Números Enteros (Z)",
        contenido: `
            <div class="explicacion-step">
                <h4>Más allá del cero</h4>
                <p>Incluyen a los naturales y a sus opuestos negativos: ...-3, -2, -1, 0, 1, 2, 3...</p>
                <p>Se usan para medir temperaturas bajo cero, deudas o profundidades.</p>
            </div>
            <div class="explicacion-step">
                <h4>⚠️ Ley de Signos (Multiplicación y División)</h4>
                <ul>
                    <li><strong>(+) × (+) = (+)</strong> (Amigo de mi amigo es mi amigo)</li>
                    <li><strong>(-) × (-) = (+)</strong> (Enemigo de mi enemigo es mi amigo)</li>
                    <li><strong>(+) × (-) = (-)</strong> (Amigo de mi enemigo es mi enemigo)</li>
                    <li><strong>(-) × (+) = (-)</strong> (Enemigo de mi amigo es mi enemigo)</li>
                </ul>
                <p>Ejemplo: (-5) × (-3) = 15</p>
            </div>
        `
    },
    'Q': {
        titulo: "Números Racionales (Q)",
        contenido: `
            <div class="explicacion-step">
                <h4>Partes de un todo</h4>
                <p>Son números que se pueden escribir como fracción (a/b). Incluyen decimales y enteros.</p>
            </div>
            <div class="explicacion-step">
                <h4>Multiplicación de Fracciones</h4>
                <p>¡Es la más fácil! Se multiplica directo:</p>
                <p class="math-example">(a/b) × (c/d) = (a×c) / (b×d)</p>
                <p>Ejemplo: (2/3) × (1/5) = 2/15</p>
            </div>
            <div class="explicacion-step">
                <h4>División de Fracciones</h4>
                <p>Multiplicamos en cruz (o "la oreja"):</p>
                <p class="math-example">(a/b) ÷ (c/d) = (a×d) / (b×c)</p>
                <p>Ejemplo: (1/2) ÷ (3/4) = 4/6</p>
            </div>
        `
    },
    1: {
        titulo: "División por 1 Cifra: Repartiendo Dulces",
        contenido: `
            <div class="explicacion-step">
                <h4>✨ ¿Qué es dividir?</h4>
                <p>La división es como repartir. Si sabes repartir dulces entre amigos, ¡sabes dividir!</p>
            </div>
            <div class="explicacion-step">
                <h4>✳️ Paso a Paso</h4>
                <p>Vamos repartiendo número por número, de izquierda a derecha.</p>
                <p><strong>✏️ Ejemplo: 648 ÷ 3</strong></p>
                <ol>
                    <li><strong>6 ÷ 3:</strong> Cabe 2 veces. (2 × 3 = 6). Restamos y queda 0.</li>
                    <li><strong>Bajar el 4:</strong> Ahora dividimos 4 ÷ 3. Cabe 1 vez. (1 × 3 = 3). Restamos y queda 1.</li>
                    <li><strong>Bajar el 8:</strong> Se forma el 18. Dividimos 18 ÷ 3. Cabe 6 veces. (6 × 3 = 18). Restamos y queda 0.</li>
                </ol>
                <p class="math-example">Resultado: 216</p>
                <p><strong>⭐ Truco:</strong> Cada número que bajas forma un “número nuevo” para seguir dividiendo.</p>
            </div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaDivision(1)">Practicar Nivel 1</button></div>
        `
    },
    2: {
        titulo: "División por 2 Cifras: Pensando en Grande",
        contenido: `
            <div class="explicacion-step">
                <h4>✳️ El Reto de las 2 Cifras</h4>
                <p>Usamos el mismo proceso, pero pensamos un poquito más porque el divisor tiene dos números.</p>
            </div>
            <div class="explicacion-step">
                <h4>✏️ Ejemplo: 1872 ÷ 24</h4>
                <p>1. Miramos los primeros números. ¿Cabe 24 en 18? No. Tomamos <strong>187</strong>.</p>
                <p>2. ¿Cuántas veces cabe 24 en 187? Probamos:</p>
                <ul>
                    <li>24 × 8 = 192 (Se pasa)</li>
                    <li>24 × 7 = 168 (¡Perfecto!)</li>
                </ul>
                <p>3. Ponemos 7 y restamos: 187 - 168 = 19.</p>
                <p>4. Bajamos el 2. Ahora tenemos <strong>192</strong>.</p>
                <p>5. ¿Cabe 24 en 192? ¡Sí, 8 veces exactas!</p>
                <p class="math-example">Resultado: 78</p>
                <p><strong>⭐ Truco:</strong> Prueba multiplicar el divisor por 4, 5, 6... hasta encontrar el que más se acerque.</p>
            </div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaDivision(2)">Practicar Nivel 2</button></div>
        `
    },
    3: {
        titulo: "División con Resto: Cuando Sobra Algo",
        contenido: `
            <div class="explicacion-step">
                <h4>✳️ No siempre es exacto</h4>
                <p>A veces la división no da exacta, y queda un número sobrante llamado "Resto".</p>
            </div>
            <div class="explicacion-step">
                <h4>✏️ Ejemplo: 50 ÷ 6</h4>
                <p>Buscamos en la tabla del 6:</p>
                <ul>
                    <li>6 × 8 = 48 (Cerca)</li>
                    <li>6 × 9 = 54 (Se pasa)</li>
                </ul>
                <p>Elegimos el 8.</p>
                <p>Restamos: 50 - 48 = <strong>2</strong></p>
                <p class="math-example">Resultado: 8 y sobra 2</p>
                <p>También se escribe: <strong>8 R 2</strong></p>
                <p><strong>⭐ Truco:</strong> El resto siempre debe ser menor que el divisor.</p>
            </div>
            <div style="margin-top: 2rem; text-align: center;"><button class="action-btn" onclick="irAPracticaDivision(1)">Practicar (Intenta que sobre)</button></div>
        `
    },
    4: {
        titulo: "División Larga: Paso a Paso",
        contenido: `
            <div class="explicacion-step">
                <h4>✳️ Proceso Repetitivo</h4>
                <p>Cuando el número es grande, hacemos el mismo proceso una y otra vez: Dividir, Multiplicar, Restar, Bajar.</p>
            </div>
            <div class="explicacion-step">
                <h4>✏️ Ejemplo: 4368 ÷ 12</h4>
                <ol>
                    <li><strong>43 ÷ 12:</strong> Cabe 3 veces (36). Sobran 7.</li>
                    <li><strong>Bajar 6 (76):</strong> Cabe 6 veces (72). Sobran 4.</li>
                    <li><strong>Bajar 8 (48):</strong> Cabe 4 veces (48). Sobra 0.</li>
                </ol>
                <p class="math-example">Resultado: 364</p>
            </div>
            <div class="explicacion-step">
                <h4>🎯 Consejos para aprender más rápido</h4>
                <ul>
                    <li>Divide despacio y por pasos.</li>
                    <li>Si te confundes, vuelve al número anterior.</li>
                    <li>Practica multiplicación: ¡ayuda muchísimo!</li>
                    <li>Cuando no sepas, prueba multiplicando hasta acercarte.</li>
                </ul>
            </div>
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
        
        // Theme Toggle Logic
        const themeBtn = $('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', App.toggleTheme);
        }

        // Sound Toggle Logic
        const soundBtn = $('sound-toggle');
        if (soundBtn) {
            soundBtn.addEventListener('click', App.toggleSound);
            // Set initial icon
            soundBtn.textContent = window.sounds.enabled ? '🔊' : '🔇';
        }

        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeBtn) themeBtn.textContent = '☀️';
        }

        // Global Sound Listeners
        document.addEventListener('click', (e) => {
            // Play click sound for buttons and interactive elements
            if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.card') || e.target.closest('.menu-item')) {
                window.sounds.playClick();
            }
        });

        // Inicialización Responsive
        const sidebar = $('sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.add('hidden');
        }

        // Desktop Sidebar Toggle (Ahora funciona en Móvil también)
        const desktopToggleBtn = $('desktop-sidebar-toggle');
        if (desktopToggleBtn) {
            desktopToggleBtn.addEventListener('click', () => {
                const sidebar = $('sidebar');
                
                // Cycle: Expanded -> Collapsed -> Hidden -> Expanded
                if (sidebar.classList.contains('hidden')) {
                    sidebar.classList.remove('hidden');
                    sidebar.classList.remove('collapsed'); // Reset to full expanded
                } else if (sidebar.classList.contains('collapsed')) {
                    sidebar.classList.remove('collapsed');
                    sidebar.classList.add('hidden');
                } else {
                    sidebar.classList.add('collapsed');
                }
            });
        }

        // Cerrar menú al hacer click en un item (móvil)
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    // En móvil, al hacer click, colapsamos o escondemos?
                    // Mejor esconder para dar espacio
                    $('sidebar').classList.add('hidden');
                    $('sidebar').classList.remove('collapsed');
                }
            });
        });
        
        // Inicializar vista
        UI.changeMode('home');
    },

    handleKeydown: (e) => {
        if (state.mode === 'calculadora') {
            if ((e.key >= '0' && e.key <= '9') || e.key === '.') Calculator.inputNumber(e.key);
            else if (['+', '-', '*', '/'].includes(e.key)) Calculator.inputOperator(e.key);
            else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); Calculator.equals(); }
            else if (e.key === 'Escape') Calculator.clear();
            else if (e.key === 'Backspace') Calculator.backspace();
        } else if (state.mode === 'generador-tablas' && e.key === 'Enter') {
            if (document.activeElement === DOM.inputs.numero) App.generate();
        }
    },

    toggleTheme: () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        const themeBtn = $('theme-toggle');
        if (themeBtn) themeBtn.textContent = isDark ? '☀️' : '🌙';
    },

    toggleSound: () => {
        const isEnabled = window.sounds.toggleMute();
        const soundBtn = $('sound-toggle');
        if (soundBtn) soundBtn.textContent = isEnabled ? '🔊' : '🔇';
        window.notifications.show(isEnabled ? 'Sonido Activado' : 'Sonido Desactivado', 'info');
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
        if (state.mode === 'generador-tablas') topic = 'multiplicar';
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

        if (mode === 'generador-tablas') {
            const num = DOM.inputs.numero.value;
            if (!num) { 
                window.notifications.show('Por favor ingresa un número', 'error'); 
                return; 
            }
            
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
window.UI = UI; // Expose UI globally
window.DOM = DOM; // Expose DOM globally
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
window.mostrarTemasDivision = UI.showDivisionTopics;
window.mostrarTemasMultiplicacion = UI.showMultiplicationTopics; // Nueva función global
window.mostrarTemasConjuntos = UI.showSetsTopics; // Nueva función global
window.volverANiveles = UI.backToLevels; // Nueva función global

// Bridge Calculadora
window.calcNumero = (n) => Calculator.inputNumber(n);
window.calcOperador = (op) => Calculator.inputOperator(op);
window.calcIgual = () => Calculator.equals();
window.calcClear = () => Calculator.clear();

window.logout = async () => {
    const confirmed = await window.modals.confirm('¿Estás seguro de que deseas cerrar sesión?', 'Cerrar Sesión');
    if(confirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/';
    }
};

if (typeof module !== 'undefined') {
    module.exports = { MathLogic, Calculator };
}
