require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

const profileDefaults = {
    name: 'Explorador',
    avatar: '🦁',
    level: 1,
    stars: 0,
    trophies: 0,
    exercisesCompleted: 0,
    gameRecords: { multiplicationRush: 0 },
    history: []
};

const applyProfileDefaults = (profile = {}) => {
    const merged = { ...profileDefaults, ...profile };
    merged.gameRecords = {
        ...profileDefaults.gameRecords,
        ...(profile?.gameRecords || {})
    };
    merged.history = Array.isArray(profile?.history) ? profile.history : [];
    return merged;
};

const serializeProfile = (profileDoc) => {
    if (!profileDoc) {
        return applyProfileDefaults();
    }
    const raw = typeof profileDoc.toObject === 'function' ? profileDoc.toObject() : profileDoc;
    return applyProfileDefaults(raw);
};

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Rutas de Vistas (Mover arriba para prioridad)
app.get('/', (req, res) => {
    const loginPath = path.join(__dirname, 'public', 'login.html');
    res.sendFile(loginPath);
});

app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Conexión a MongoDB (No bloqueante)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error conectando a MongoDB:', err));

// Rutas de Autenticación
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar usuario. El nombre podría estar en uso.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ profile: serializeProfile(user.profile) });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo obtener el perfil' });
    }
});

const ALLOWED_PROFILE_FIELDS = new Set([
    'name',
    'avatar',
    'level',
    'stars',
    'trophies',
    'exercisesCompleted',
    'gameRecords'
]);

app.put('/api/profile', authenticate, async (req, res) => {
    try {
        const updates = (req.body && req.body.profile) || {};
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (!user.profile) {
            user.profile = {};
        }

        Object.entries(updates).forEach(([field, value]) => {
            if (!ALLOWED_PROFILE_FIELDS.has(field)) return;
            if (field === 'gameRecords') {
                user.profile.gameRecords = {
                    ...(user.profile.gameRecords || {}),
                    ...(value || {})
                };
            } else {
                user.profile[field] = value;
            }
        });

        await user.save();
        res.json({ profile: serializeProfile(user.profile) });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo actualizar el perfil' });
    }
});

app.post('/api/profile/history', authenticate, async (req, res) => {
    try {
        const entry = req.body?.entry;
        if (!entry || !entry.type) {
            return res.status(400).json({ error: 'Entrada de historial inválida' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (!user.profile) {
            user.profile = {};
        }

        if (!Array.isArray(user.profile.history)) {
            user.profile.history = [];
        }

        const normalizedEntry = {
            clientId: entry.clientId || undefined,
            type: entry.type,
            module: entry.module || 'general',
            score: typeof entry.score === 'number' ? entry.score : 0,
            totalQuestions: typeof entry.totalQuestions === 'number' ? entry.totalQuestions : undefined,
            grade: typeof entry.grade === 'number' ? entry.grade : undefined,
            meta: entry.meta && typeof entry.meta === 'object' ? entry.meta : {},
            createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date()
        };

        if (normalizedEntry.clientId) {
            user.profile.history = user.profile.history.filter((item) => item.clientId !== normalizedEntry.clientId);
        }

        user.profile.history.unshift(normalizedEntry);
        user.profile.history = user.profile.history.slice(0, 100);
        await user.save();

        res.json({ history: serializeProfile(user.profile).history });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo actualizar el historial' });
    }
});

// Rutas de Vistas
// (Eliminadas de aquí porque se movieron arriba)

// Manejo de rutas no encontradas (SPA fallback si fuera necesario, pero aquí redirigimos a login)
app.get('*', (req, res) => {
    res.redirect('/');
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
}

module.exports = app;