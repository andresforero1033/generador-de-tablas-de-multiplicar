const request = require('supertest');
const mongoose = require('mongoose');

// Mock Mongoose
jest.mock('mongoose', () => {
    const mSchema = {
        pre: jest.fn(),
        methods: {},
    };
    return {
        connect: jest.fn().mockResolvedValue('Connected'),
        Schema: jest.fn(() => mSchema),
        model: jest.fn(),
    };
});

// Mock User Model
jest.mock('../models/User', () => ({
    findOne: jest.fn(),
    save: jest.fn(),
}));

const app = require('../server');

describe('Server Routes', () => {
    
    test('GET / should return login page', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.header['content-type']).toMatch(/html/);
    });

    test('GET /app should return app page', async () => {
        const res = await request(app).get('/app');
        expect(res.statusCode).toBe(200);
        expect(res.header['content-type']).toMatch(/html/);
    });

    test('GET /unknown should redirect to /', async () => {
        const res = await request(app).get('/random-path');
        expect(res.statusCode).toBe(302); // Redirect
        expect(res.header['location']).toBe('/');
    });

});
