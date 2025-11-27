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
            } else {
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
            } else {
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
            }
        }

        return { result, steps };
    }
};
