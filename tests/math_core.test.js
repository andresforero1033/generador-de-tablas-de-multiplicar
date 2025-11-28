const MathCore = require('../public/js/math_core');

describe('MathCore Library', () => {
    
    describe('Utilities', () => {
        test('gcd should calculate greatest common divisor', () => {
            expect(MathCore.gcd(12, 15)).toBe(3);
            expect(MathCore.gcd(10, 5)).toBe(5);
            expect(MathCore.gcd(7, 3)).toBe(1);
        });

        test('simplifyFraction should reduce fractions', () => {
            expect(MathCore.simplifyFraction(2, 4)).toEqual({ num: 1, den: 2 });
            expect(MathCore.simplifyFraction(10, 15)).toEqual({ num: 2, den: 3 });
            expect(MathCore.simplifyFraction(5, 5)).toEqual({ num: 1, den: 1 });
        });
    });

    describe('Generators', () => {
        test('generateNumber should return number within range for N', () => {
            const num = MathCore.generateNumber('N', { min: 0, max: 10 });
            expect(num).toBeGreaterThanOrEqual(0);
            expect(num).toBeLessThanOrEqual(10);
        });

        test('generateNumber should return fraction for Q', () => {
            const frac = MathCore.generateNumber('Q');
            expect(frac).toHaveProperty('num');
            expect(frac).toHaveProperty('den');
        });
    });

    describe('Operations', () => {
        test('solve addition for integers', () => {
            const problem = { a: 5, b: 3, type: 'Z', operation: 'addition' };
            const solution = MathCore.solve(problem);
            expect(solution.result).toBe(8);
        });

        test('solve subtraction for integers', () => {
            const problem = { a: 5, b: 8, type: 'Z', operation: 'subtraction' };
            const solution = MathCore.solve(problem);
            expect(solution.result).toBe(-3);
        });

        test('solve multiplication for fractions', () => {
            const problem = { 
                a: { num: 1, den: 2 }, 
                b: { num: 1, den: 3 }, 
                type: 'Q', 
                operation: 'multiplication' 
            };
            const solution = MathCore.solve(problem);
            expect(solution.result).toEqual({ num: 1, den: 6 });
        });

        test('solve division for fractions', () => {
            const problem = { 
                a: { num: 1, den: 2 }, 
                b: { num: 1, den: 4 }, 
                type: 'Q', 
                operation: 'division' 
            };
            const solution = MathCore.solve(problem);
            // (1/2) / (1/4) = (1/2) * (4/1) = 4/2 = 2/1
            expect(solution.result).toEqual({ num: 2, den: 1 });
        });
    });
});
