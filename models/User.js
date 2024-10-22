const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        type: Array, // Para armazenar produtos no carrinho
        default: []  // Inicializa como um array vazio
    },
    securityQuestion: {
        type: String,
        required: false // Pergunta secreta
    },
    securityAnswer: {
        type: String,
        required: false // Resposta secreta
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.compareSecurityAnswer = async function(answer) {
    if (!this.securityAnswer) return false; // Se não houver resposta de segurança, retorna false
    return await bcrypt.compare(answer, this.securityAnswer);
};

// Middleware para criptografar a senha e a resposta da segurança antes de salvar
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    if (this.isModified('securityAnswer')) {
        this.securityAnswer = await bcrypt.hash(this.securityAnswer, 10); // Criptografar a resposta
    }

    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
