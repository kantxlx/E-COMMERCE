const express = require('express');
const router = express.Router();
const Address = require('../models/Address');

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next(); // Se o usuário está autenticado, passa para o próximo middleware
    } else {
        res.redirect('/login'); // Caso contrário, redireciona para a página de login
    }
}

// Rota para listar endereços de um usuário
router.get('/:userId', isAuthenticated, async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.params.userId });
        res.render('addresses', { addresses, userId: req.params.userId });
    } catch (error) {
        console.error('Erro ao buscar endereços:', error);
        res.status(500).send('Erro no servidor');
    }
});

// Rota para criar um novo endereço
router.post('/add', isAuthenticated, async (req, res) => {
    try {
        const { userId, cep, estado, cidade, bairro, quadra, numero, complemento } = req.body; // Adicionando bairro
        const newAddress = new Address({ userId, cep, estado, cidade, bairro, quadra, numero, complemento }); // Incluindo bairro
        await newAddress.save();
        res.redirect(`/addresses/${userId}`);
    } catch (error) {
        console.error('Erro ao adicionar endereço:', error);
        res.status(500).send('Erro no servidor');
    }
});

// Rota para deletar um endereço
router.post('/delete/:addressId', isAuthenticated, async (req, res) => {
    try {
        const { userId } = req.body;
        await Address.findByIdAndDelete(req.params.addressId);
        res.redirect(`/addresses/${userId}`);
    } catch (error) {
        console.error('Erro ao deletar endereço:', error);
        res.status(500).send('Erro no servidor');
    }
});

module.exports = router;
