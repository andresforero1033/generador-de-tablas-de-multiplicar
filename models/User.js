const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const HistoryEntrySchema = new mongoose.Schema({
    clientId: { type: String },
    type: { type: String, enum: ['exam', 'game', 'practice', 'custom'], required: true },
    module: { type: String, default: 'general' },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number },
    grade: { type: Number },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ProfileSchema = new mongoose.Schema({
    name: { type: String, default: 'Explorador' },
    avatar: { type: String, default: '🦁' },
    level: { type: Number, default: 1 },
    stars: { type: Number, default: 0 },
    trophies: { type: Number, default: 0 },
    exercisesCompleted: { type: Number, default: 0 },
    gameRecords: {
        multiplicationRush: { type: Number, default: 0 }
    },
    history: { type: [HistoryEntrySchema], default: [] }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: { type: ProfileSchema, default: () => ({}) }
});

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);