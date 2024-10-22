const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Adiciona produto ao carrinho
router.post('/add/:productId', async (req, res) => {
    console.log('Usuário na sessão:', req.session.user);
    
    try {
        // Verifica se o usuário está logado
        if (!req.isAuthenticated()) {
            return res.status(401).json({
                success: false,
                message: 'Para continuar a compra, entre ou cadastre no nosso site.' 
            });
        }

        const productId = req.params.productId;
        const { quantity } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
        }

        // Se a sessão de carrinho não existir, cria uma nova
        if (!req.session.cart) req.session.cart = [];

        const existingProductIndex = req.session.cart.findIndex(item => item.productId.toString() === product._id.toString());

        if (existingProductIndex !== -1) {
            req.session.cart[existingProductIndex].quantity += parseInt(quantity || 1);
        } else {
            req.session.cart.push({
                productId: product._id, // Atualizando para usar productId
                name: product.nome,
                price: product.preco,
                imagemCapa: product.imagemCapa || product.imagens[0], // Atualizando para usar imagemCapa
                quantity: parseInt(quantity || 1)
            });
        }

        console.log('Produto adicionado ao carrinho:', req.session.cart);
        return res.json({ success: true, message: 'Produto adicionado ao carrinho.' });
    } catch (error) {
        console.error('Erro ao adicionar produto ao carrinho:', error);
        return res.status(500).json({ success: false, message: 'Erro ao adicionar produto ao carrinho.' });
    }
});

// Rota para renderizar a view do carrinho
router.get('/carrinho', (req, res) => {
    const cartItems = req.session.cart || [];
    console.log(cartItems); // Verifica o conteúdo do carrinho no terminal
    res.render('cart', { cartItems });  // Renderiza a view 'cart'
});

// Rota para retornar os itens do carrinho como JSON
router.get('/carrinho/items', (req, res) => {
    const cartItems = req.session.cart || [];
    console.log(cartItems); // Verifica o conteúdo do carrinho no terminal
    res.json(cartItems);  // Envia os dados do carrinho em formato JSON
});

// Contar itens no carrinho
router.get('/count', (req, res) => {
    const count = req.session.cart ? req.session.cart.reduce((acc, item) => acc + item.quantity, 0) : 0;
    res.json({ count });
});

// Remover item do carrinho
router.delete('/remove/:productId', (req, res) => {
    if (!req.session.cart) return res.status(400).json({ success: false, message: 'Carrinho está vazio.' });

    const productId = req.params.productId; // Captura o productId
    req.session.cart = req.session.cart.filter(item => item.productId.toString() !== productId);
    res.json({ success: true });
});

// Remover item do carrinho
router.post('/remove/:productId', (req, res) => {
    console.log('ID do produto a ser removido:', req.params.productId);
    if (!req.session.cart) return res.redirect('/cart');

    req.session.cart = req.session.cart.filter(item => item.productId.toString() !== req.params.productId);
    res.redirect('/cart/carrinho');
});

// Limpar carrinho
router.post('/clear', (req, res) => {
    req.session.cart = [];
    res.redirect('/cart');
});

// Atualiza a quantidade de um produto no carrinho
router.post('/update-quantity/:productId', (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!req.session.cart) return res.status(400).json({ success: false, message: 'Carrinho está vazio.' });

    const productIndex = req.session.cart.findIndex(item => item.productId.toString() === productId);

    if (productIndex !== -1 && quantity > 0) {
        req.session.cart[productIndex].quantity = parseInt(quantity);
        return res.status(200).json({ success: true, total: calculateTotal(req.session.cart) });
    } else {
        return res.status(400).json({ success: false, message: 'Produto não encontrado ou quantidade inválida.' });
    }
});


// Função para calcular o total do carrinho
const calculateTotal = (cart) => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2);
};

// Rota para exibir detalhes do produto
router.get('/product-details/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Produto não encontrado');
        }

        const relevantProducts = await Product.aggregate([{ $sample: { size: 6 } }]);
        res.render('product-details', { product, relevantProducts });
    } catch (error) {
        res.status(500).send('Erro ao exibir detalhes do produto');
    }
});

module.exports = router;
