const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcrypt');

// Página de cadastro
router.get('/cadastro', (req, res) => {
    res.render('cadastro', { error: req.flash('error') || '' });
});

// Página de login
router.get('/login', (req, res) => {
    res.render('login', { error: req.flash('error') });
});

// Rota de cadastro
router.post('/cadastro', async (req, res) => {
    const { name, email, password, confirmPassword, securityQuestion, securityAnswer } = req.body;

    // Verificação de campos obrigatórios
    if (!name || !email || !password || !confirmPassword) {
        return res.render('cadastro', { error: 'Preencha todos os campos.' });
    }

    // Verificação de senha - mínimo 6 caracteres, letras e números
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

    if (!passwordRegex.test(password)) {
        return res.render('cadastro', { error: 'A senha deve ter no mínimo 6 caracteres e incluir letras e números.' });
    }

    // Verificação de confirmação de senha
    if (password !== confirmPassword) {
        return res.render('cadastro', { error: 'As senhas não coincidem.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.render('cadastro', { error: 'E-mail já cadastrado.' });
        }

        // Criação de novo usuário
        user = new User({ name, email, password, securityQuestion, securityAnswer });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        res.render('cadastro', { error: 'Erro ao cadastrar. Tente novamente.' });
    }
});

// Rota de login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/login');
        }

        // Verifica a senha usando o método de comparação do modelo
        const isPasswordCorrect = await user.comparePassword(req.body.password);
        if (!isPasswordCorrect) {
            req.flash('error', 'Senha incorreta.');
            return res.redirect('/login');
        }

        req.logIn(user, (err) => {
            if (err) return next(err);

            // Redireciona para a URL salva ou para a página inicial
            const redirectUrl = req.session.redirectTo || '/';
            delete req.session.redirectTo; // Remove a URL da sessão após o redirecionamento

            res.send(`
                <script>
                    sessionStorage.setItem('userLoggedIn', 'true');
                    window.location.href = '${redirectUrl}';
                </script>
            `);
        });
    })(req, res, next);
});

// Rota de logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

module.exports = router;
