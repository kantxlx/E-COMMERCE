const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcrypt');

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next(); // Se o usuário está autenticado, passa para o próximo middleware
    } else {
        res.redirect('/login'); // Caso contrário, redireciona para a página de login
    }
}

// Rota para editar o perfil do usuário
router.get('/profile/:id', isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Renderiza a página de perfil passando os dados do usuário, incluindo o userId
        res.render('profile', {
            userId: user._id,
            name: user.name,
            email: user.email,
            securityQuestion: user.securityQuestion,
            errorMessage: req.flash('error'),  // Adiciona a mensagem de erro
            successMessage: req.flash('success') // Adiciona a mensagem de sucesso
        });
    } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error); // Log de erro
        res.status(500).json({ message: 'Erro ao buscar informações do usuário' });
    }
});

router.post('/profile/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, securityQuestion, securityAnswer } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'Usuário não encontrado.');
            return res.redirect(`/user/profile/${userId}`);
        }

        // Atualiza as informações do usuário
        user.name = name;
        user.email = email;
        if (securityQuestion) user.securityQuestion = securityQuestion;
        if (securityAnswer) user.securityAnswer = securityAnswer;

        await user.save();
        req.flash('success', 'Informações do usuário atualizadas com sucesso.');
        res.redirect(`/user/profile/${userId}`);
    } catch (error) {
        req.flash('error', 'Erro ao atualizar as informações.');
        res.redirect(`/user/profile/${userId}`);
    }
});

router.post('/profile/edit/question/:id', isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.id;
        const { newSecurityQuestion, newSecurityAnswer } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Atualiza a pergunta e a resposta de segurança
        user.securityQuestion = newSecurityQuestion; // Nova pergunta
        user.securityAnswer = newSecurityAnswer; // Nova resposta

        await user.save();

        res.redirect(`/user/profile/${userId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar pergunta secreta', error: error.message });
    }
});

// Editar informações do usuário
router.put('/editar', isAuthenticated, async (req, res) => {
    const { name, email } = req.body;

    try {
        const user = await User.findById(req.user._id); // Verifique como você armazena a sessão do usuário

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Atualizar informações do usuário
        user.name = name || user.name;
        user.email = email || user.email;

        await user.save();

        res.status(200).json({ message: 'Informações do usuário atualizadas com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar informações do usuário.', error });
    }
});

// POST: Alterar senha de um usuário
router.post('/alterar-senha/:id', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.params.id;

    // Verificação de nova senha - mínimo 6 caracteres, letras e números
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

    try {
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error_msg', 'Usuário não encontrado.');
            return res.redirect(`/user/alterar-senha/${userId}`);
        }

        // Verifica se o usuário logado é o mesmo que está tentando alterar a senha
        if (req.user.id !== user.id.toString()) {
            req.flash('error_msg', 'Acesso negado.');
            return res.redirect(`/user/alterar-senha/${userId}`);
        }

        // Compara a senha atual com a armazenada no banco de dados
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            req.flash('error_msg', 'Senha atual incorreta.');
            return res.redirect(`/user/alterar-senha/${userId}`);
        }

        // Verifica se a nova senha atende aos requisitos de segurança
        if (!passwordRegex.test(newPassword)) {
            req.flash('error_msg', 'A nova senha deve ter no mínimo 6 caracteres e incluir letras e números.');
            return res.redirect(`/user/alterar-senha/${userId}`);
        }

        // Verifica se as novas senhas são iguais
        if (newPassword !== confirmPassword) {
            req.flash('error_msg', 'As novas senhas não correspondem.');
            return res.redirect(`/user/alterar-senha/${userId}`);
        }

        // Atualiza a senha do usuário
        user.password = newPassword;
        await user.save();

        // Mensagem de sucesso
        req.flash('success_msg', 'Senha alterada com sucesso.');
        return res.render('alterar-senha', {
            user: req.user,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error('Erro ao alterar a senha:', error);
        req.flash('error_msg', 'Erro ao alterar a senha.');
        return res.render('alterar-senha', {
            user: req.user,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    }
});

// Rota GET para renderizar a página de editar informações de um usuário específico
router.get('/editar/:id', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).render('404', { message: 'Usuário não encontrado.' }); // Renderizar uma página de erro se o usuário não for encontrado
        }
        res.render('editar', { user }); // Passe o usuário para a view
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuário.', error });
    }
});

// GET: Renderizar a página de alteração de senha de um usuário específico
router.get('/alterar-senha/:id', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).render('404', { message: 'Usuário não encontrado.' });
        }

        // Verifica se o usuário logado é o mesmo que está tentando acessar a página
        if (req.user.id !== user.id.toString()) {
            return res.status(403).render('403', { message: 'Acesso negado.' });
        }

        // Renderiza a página de alterar senha
        res.render('alterar-senha', {
            user,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.redirect('/login'); // Redireciona para login em caso de erro
    }
});

// Rota para a página de esqueci a senha
router.get('/forgot-password', (req, res) => {
    const step = 1; // A primeira etapa
    const error = req.flash('error'); // Se estiver usando express-flash
    const success = req.flash('success'); // Se estiver usando express-flash para mensagens de sucesso
    res.render('forgot-password', {
        step: step,
        error: error.length > 0 ? error[0] : null, // Passa o primeiro erro, se houver
        success: success.length > 0 ? success[0] : null // Passa a primeira mensagem de sucesso, se houver
    });
});

// Rota para processar o envio do e-mail
router.post('/forgot-password', async (req, res) => {
    const email = req.body.email;

    try {
        const user = await User.findOne({ email: email }); // Buscando o usuário

        if (!user) {
            req.flash('error', 'E-mail não encontrado.');
            return res.redirect('/user/forgot-password');
        }

        const securityQuestion = user.securityQuestion; // Pergunta secreta do usuário
        res.render('forgot-password', {
            step: 2,
            securityQuestion: securityQuestion,
            userId: user._id, // Passando o ID do usuário
            error: null,
            success: null
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Ocorreu um erro ao procurar o usuário.');
        return res.redirect('/user/forgot-password');
    }
});

// Rota para verificar a resposta da pergunta de segurança
router.post('/verify-security-answer', async (req, res) => {
    const { userId, securityAnswer } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'Usuário não encontrado.');
            return res.redirect('/user/forgot-password');
        }
        
        // Use o método compareSecurityAnswer para verificar a resposta
        const isAnswerCorrect = await user.compareSecurityAnswer(securityAnswer);
        if (!isAnswerCorrect) {
            req.flash('error', 'Resposta de segurança incorreta.');
            return res.redirect('/user/forgot-password');
        }

        // Se a resposta estiver correta, renderize a página de redefinição de senha
        res.render('reset-password', { userId: userId, error: null });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Ocorreu um erro ao verificar a resposta.');
        return res.redirect('/user/forgot-password');
    }
});

// Rota para redefinir a senha
router.post('/reset-password', async (req, res) => {
    const { userId, newPassword, confirmPassword } = req.body;

    // Verificação de nova senha - mínimo 6 caracteres, incluindo letras e números
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

    try {
        // Verifica se as senhas correspondem
        if (newPassword !== confirmPassword) {
            return res.render('reset-password', {
                userId: userId,
                error: 'As senhas não correspondem.',
                success: ''
            });
        }

        // Verifica se a nova senha atende aos requisitos de segurança
        if (!passwordRegex.test(newPassword)) {
            return res.render('reset-password', {
                userId: userId,
                error: 'A nova senha deve ter no mínimo 6 caracteres, incluir letras, números e pode ter caracteres especiais.',
                success: ''
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).render('reset-password', {
                userId: userId,
                error: 'Usuário não encontrado',
                success: ''
            });
        }

        // Atualiza a senha do usuário
        user.password = newPassword; // O método de hash será chamado no middleware de pré-salvamento
        await user.save();

        // Renderiza a página com a mensagem de sucesso
        return res.render('reset-password', {
            userId: userId,
            success: 'Senha redefinida com sucesso!', // Mensagem de sucesso
            error: ''
        });
    } catch (error) {
        console.error(error);
        return res.render('reset-password', {
            userId: userId,
            error: 'Erro ao redefinir a senha. Tente novamente.',
            success: ''
        });
    }
});

module.exports = router;
