/**
 * Math Core Library
 * Handles generation of problems and solutions for N, Z, Q number sets.
 */

const MathCore = {
    // Utilities
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    
    gcd: (a, b) => b === 0 ? a : MathCore.gcd(b, a % b),
    
    simplifyFraction: (num, den) => {
        const gcd = MathCore.gcd(Math.abs(num), Math.abs(den));
        return { num: num / gcd, den: den / gcd };
    },

    // Generators
    generateNumber: (type, range = { min: -10, max: 10 }) => {
        switch (type) {
            case 'N': // Naturales (Positive Integers + 0)
                return MathCore.randomInt(Math.max(0, range.min), Math.max(1, range.max));
            case 'Z': // Enteros (Integers)
                return MathCore.randomInt(range.min, range.max);
            case 'Q': // Racionales (Fractions)
                let den = MathCore.randomInt(2, 10);
                let num = MathCore.randomInt(range.min, range.max);
                return MathCore.simplifyFraction(num, den);
            default:
                return 0;
        }
    },

    formatNumber: (num, type) => {
        if (type === 'Q') {
            return `<span class="fraction"><sup>${num.num}</sup><sub>${num.den}</sub></span>`;
        }
        return num < 0 ? `(${num})` : `${num}`;
    },

    // Operation Logic
    generateOperation: (operation, type, difficulty = 1) => {
        let range;
        switch(difficulty) {
            case 1: range = { min: -9, max: 9 }; break;
            case 2: range = { min: -99, max: 99 }; break;
            case 3: range = { min: -999, max: 999 }; break;
            default: range = { min: -9, max: 9 };
        }

        // Adjust for Naturals
        if (type === 'N') {
            range.min = 0;
            if (difficulty === 1) range.max = 9;
            if (difficulty === 2) range.max = 99;
            if (difficulty === 3) range.max = 999;
        }

        let a = MathCore.generateNumber(type, range);
        let b = MathCore.generateNumber(type, range);

        // Avoid division by zero or complicated fractions for basic levels
        if (operation === 'division') {
            if (type === 'Q') {
                while (b.num === 0) b = MathCore.generateNumber(type, range);
            } else {
                while (b === 0) b = MathCore.generateNumber(type, range);
            }
        }
        
        // For subtraction in Naturals, ensure a >= b to avoid negatives if we want to stay in N
        if (operation === 'subtraction' && type === 'N') {
            if (b > a) {
                const temp = a;
                a = b;
                b = temp;
            }
        }

        return { a, b, type, operation };
    },

    solve: (problem) => {
        const { a, b, type, operation } = problem;
        let result, steps = [];

        if (type === 'Q') {
            // Fraction operations
            if (operation === 'multiplication') {
                // (a/b) * (c/d) = (a*c) / (b*d)
                const num = a.num * b.num;
                const den = a.den * b.den;
                const simplified = MathCore.simplifyFraction(num, den);
                
                steps.push(`Multiplicar numeradores: ${a.num} × ${b.num} = ${num}`);
                steps.push(`Multiplicar denominadores: ${a.den} × ${b.den} = ${den}`);
                steps.push(`Fracción resultante: ${num}/${den}`);
                if (num !== simplified.num) {
                    steps.push(`Simplificar: ${simplified.num}/${simplified.den}`);
                }
                result = simplified;
            } else if (operation === 'division') {
                // (a/b) / (c/d) = (a/b) * (d/c)
                const num = a.num * b.den;
                const den = a.den * b.num;
                
                if (den === 0) return { result: 'Indefinido', steps: ['División por cero'] };

                const simplified = MathCore.simplifyFraction(num, den);
                
                steps.push(`Invertir divisor: ${b.num}/${b.den} → ${b.den}/${b.num}`);
                steps.push(`Multiplicar en cruz (o directo con inverso):`);
                steps.push(`Numerador: ${a.num} × ${b.den} = ${num}`);
                steps.push(`Denominador: ${a.den} × ${b.num} = ${den}`);
                if (num !== simplified.num) {
                    steps.push(`Simplificar: ${simplified.num}/${simplified.den}`);
                }
                result = simplified;
            } else if (operation === 'addition' || operation === 'subtraction') {
                // (a/b) ± (c/d)
                // Common denominator = lcm(b, d) = (b*d) / gcd(b,d)
                const commonDen = (a.den * b.den) / MathCore.gcd(a.den, b.den);
                
                const numA = a.num * (commonDen / a.den);
                const numB = b.num * (commonDen / b.den);
                
                let numRes;
                if (operation === 'addition') {
                    numRes = numA + numB;
                    steps.push(`Mínimo Común Múltiplo de denominadores (${a.den}, ${b.den}) = ${commonDen}`);
                    steps.push(`Convertir fracciones: ${a.num}/${a.den} = ${numA}/${commonDen} y ${b.num}/${b.den} = ${numB}/${commonDen}`);
                    steps.push(`Sumar numeradores: ${numA} + ${numB} = ${numRes}`);
                } else {
                    numRes = numA - numB;
                    steps.push(`Mínimo Común Múltiplo de denominadores (${a.den}, ${b.den}) = ${commonDen}`);
                    steps.push(`Convertir fracciones: ${a.num}/${a.den} = ${numA}/${commonDen} y ${b.num}/${b.den} = ${numB}/${commonDen}`);
                    steps.push(`Restar numeradores: ${numA} - ${numB} = ${numRes}`);
                }
                
                const simplified = MathCore.simplifyFraction(numRes, commonDen);
                steps.push(`Resultado: ${numRes}/${commonDen}`);
                if (numRes !== simplified.num || commonDen !== simplified.den) {
                    steps.push(`Simplificar: ${simplified.num}/${simplified.den}`);
                }
                result = simplified;
            }
        } else {
            // Integer/Natural operations
            if (operation === 'multiplication') {
                result = a * b;
                steps.push(`${a} × ${b} = ${result}`);
                // Add sign rules for Z
                if (type === 'Z') {
                    const signA = a >= 0 ? '+' : '-';
                    const signB = b >= 0 ? '+' : '-';
                    const signRes = result >= 0 ? '+' : '-';
                    steps.push(`Ley de signos: (${signA}) × (${signB}) = ${signRes}`);
                }
            } else if (operation === 'division') {
                // Division
                // For generator, we might want exact division or division with remainder
                // For this core, let's return exact float or string with remainder
                if (a % b === 0) {
                    result = a / b;
                    steps.push(`${a} ÷ ${b} = ${result}`);
                } else {
                    const quotient = Math.floor(a / b);
                    const remainder = a % b;
                    result = `${quotient} R ${remainder}`;
                    steps.push(`${a} ÷ ${b} = ${quotient} con resto ${remainder}`);
                    steps.push(`Comprobación: ${quotient} × ${b} + ${remainder} = ${quotient * b + remainder}`);
                }
                
                if (type === 'Z') {
                     steps.push(`Ley de signos aplicada al cociente.`);
                }
            } else if (operation === 'addition') {
                result = a + b;
                steps.push(`${a} + ${b} = ${result}`);
                if (type === 'Z') {
                    if ((a >= 0 && b >= 0) || (a < 0 && b < 0)) {
                        steps.push(`Signos iguales: Se suman y se mantiene el signo.`);
                    } else {
                        steps.push(`Signos diferentes: Se restan y se pone el signo del mayor valor absoluto.`);
                    }
                }
            } else if (operation === 'subtraction') {
                result = a - b;
                steps.push(`${a} - ${b} = ${result}`);
                if (type === 'Z') {
                    steps.push(`Restar es sumar el opuesto: ${a} + (${-b}) = ${result}`);
                }
            }
        }

        return { result, steps };
    },

    // Set Operations
    generateSet: (size = 5, min = 1, max = 20) => {
        const set = new Set();
        while(set.size < size) {
            set.add(MathCore.randomInt(min, max));
        }
        return Array.from(set).sort((a, b) => a - b);
    },

    categories: {
        animales: ['Perro', 'Gato', 'León', 'Tigre', 'Elefante', 'Jirafa', 'Mono', 'Oso', 'Lobo', 'Zorro', 'Águila', 'Serpiente', 'Ballena', 'Delfín', 'Tiburón', 'Conejo', 'Ratón', 'Caballo', 'Vaca', 'Cerdo'],
        frutas: ['Manzana', 'Pera', 'Plátano', 'Uva', 'Naranja', 'Limón', 'Fresa', 'Cereza', 'Piña', 'Mango', 'Sandía', 'Melón', 'Kiwi', 'Durazno', 'Ciruela', 'Papaya', 'Coco', 'Higo', 'Lima', 'Mora'],
        colores: ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Negro', 'Blanco', 'Gris', 'Rosa', 'Marrón', 'Celeste', 'Turquesa', 'Dorado', 'Plateado', 'Violeta', 'Índigo', 'Beige', 'Cian', 'Magenta'],
        paises: ['Colombia', 'México', 'España', 'Argentina', 'Perú', 'Chile', 'Brasil', 'EEUU', 'Canadá', 'Francia', 'Italia', 'Alemania', 'Japón', 'China', 'India', 'Rusia', 'Australia', 'Egipto', 'Reino Unido', 'Portugal'],
        planetas: ['Mercurio', 'Venus', 'Tierra', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Neptuno', 'Plutón', 'Sol', 'Luna', 'Ceres', 'Eris', 'Makemake', 'Haumea'],
        instrumentos: ['Guitarra', 'Piano', 'Violín', 'Batería', 'Flauta', 'Trompeta', 'Saxofón', 'Bajo', 'Arpa', 'Clarinete', 'Oboe', 'Violonchelo', 'Acordeón', 'Ukelele', 'Tambor'],
        deportes: ['Fútbol', 'Baloncesto', 'Tenis', 'Natación', 'Voleibol', 'Béisbol', 'Golf', 'Rugby', 'Boxeo', 'Atletismo', 'Ciclismo', 'Hockey', 'Esquí', 'Surf', 'Karate']
    },

    generateRandomSet: (type, size = 5, category = null) => {
        const set = new Set();
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        let sourceArray = [];
        
        if (type === 'words') {
            if (category && MathCore.categories[category]) {
                sourceArray = MathCore.categories[category];
            } else {
                // Pick a random category if not specified
                const keys = Object.keys(MathCore.categories);
                const randomKey = keys[MathCore.randomInt(0, keys.length - 1)];
                sourceArray = MathCore.categories[randomKey];
            }
        }

        let attempts = 0;
        while(set.size < size && attempts < 100) {
            attempts++;
            let item;
            if (type === 'numbers') {
                item = MathCore.randomInt(1, 50);
            } else if (type === 'letters') {
                item = letters[MathCore.randomInt(0, letters.length - 1)];
            } else if (type === 'words') {
                item = sourceArray[MathCore.randomInt(0, sourceArray.length - 1)];
            } else if (type === 'mixed') {
                const r = Math.random();
                if (r < 0.33) item = MathCore.randomInt(1, 50);
                else if (r < 0.66) item = letters[MathCore.randomInt(0, letters.length - 1)];
                else {
                    // For mixed, just pick from a default list or random category
                    const keys = Object.keys(MathCore.categories);
                    const randomKey = keys[MathCore.randomInt(0, keys.length - 1)];
                    const mixedSource = MathCore.categories[randomKey];
                    item = mixedSource[MathCore.randomInt(0, mixedSource.length - 1)];
                }
            }
            set.add(item);
        }
        
        // Sort if numbers or strings
        return Array.from(set).sort((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') return a - b;
            return String(a).localeCompare(String(b));
        });
    },

    solveSetOperation: (setA, setB, operation) => {
        const A = new Set(setA);
        const B = new Set(setB);
        let result = new Set();
        let steps = [];

        switch(operation) {
            case 'union': // A ∪ B
                setA.forEach(x => result.add(x));
                setB.forEach(x => result.add(x));
                steps.push(`Unión (∪): Elementos que están en A O en B.`);
                steps.push(`A = {${setA.join(', ')}}`);
                steps.push(`B = {${setB.join(', ')}}`);
                steps.push(`Juntamos todos sin repetir.`);
                break;
            case 'intersection': // A ∩ B
                setA.forEach(x => {
                    if(B.has(x)) result.add(x);
                });
                steps.push(`Intersección (∩): Elementos que están en A Y en B.`);
                steps.push(`Elementos comunes: {${Array.from(result).join(', ')}}`);
                break;
            case 'difference_a_b': // A - B
                setA.forEach(x => {
                    if(!B.has(x)) result.add(x);
                });
                steps.push(`Diferencia (A - B): Elementos que están en A pero NO en B.`);
                steps.push(`Quitamos de A los que también están en B.`);
                break;
            case 'difference_b_a': // B - A
                setB.forEach(x => {
                    if(!A.has(x)) result.add(x);
                });
                steps.push(`Diferencia (B - A): Elementos que están en B pero NO en A.`);
                steps.push(`Quitamos de B los que también están en A.`);
                break;
        }

        return {
            result: Array.from(result).sort((a, b) => a - b),
            steps
        };
    }
};

if (typeof module !== 'undefined') {
    module.exports = MathCore;
}
