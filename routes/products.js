const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// rota para a pagina inicial
router.get('/', async (req, res) => {
    try {
        // Buscar os produtos da categoria "Ofertas" e "Novidades"
        const ofertas = await Product.find({ categoria: 'ofertas' }).limit(10); // Limite de 10 ofertas
        const novidades = await Product.find({ categoria: 'novidades' }).limit(10); // Limite de 10 novidades

        // Renderizar a página inicial e passar os produtos
        res.render('index', { ofertas, novidades });
    } catch (error) {
        console.error('Erro ao carregar a página inicial:', error);
        res.render('erro', { mensagem: 'Erro ao carregar a página inicial.' });
    }
});

// Ver detalhes de um produto específico
router.get('/product-detail/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Produto não encontrado');
        }
        res.render('product-details', { product });
    } catch (error) {
        res.status(500).send('Erro ao exibir detalhes do produto');
    }
});

// Rota de busca
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json([]); // Retornar status 400 se a query estiver vazia
        }

        const produtos = await Product.find({
            nome: { $regex: query, $options: 'i' } // Pesquisa insensível a maiúsculas
        }).limit(10); // Limitar os resultados a 10

        if (produtos.length === 0) {
            return res.status(404).json({ message: 'Nenhum produto encontrado' }); // Retornar mensagem de nenhum produto encontrado
        }

        res.json(produtos);
    } catch (err) {
        res.status(500).send('Erro ao realizar a pesquisa'); // Mensagem de erro mais clara
    }
});

// Listar todos os produtos com filtragem e ordenação
router.get('/produtos', async (req, res) => {
    try {
        const { categoria, marca, cor, nome, minPrice, maxPrice, ordenar } = req.query;

        const query = {};
        if (categoria) query.categoria = { $in: Array.isArray(categoria) ? categoria : [categoria] };
        if (marca) {
            // A lógica abaixo converte a string de marcas em um array, caso esteja no formato de uma string separada por vírgulas
            query.marca = { $in: Array.isArray(marca) ? marca : [marca] };
        }
        if (cor) query.cor = cor;
        if (nome) query.nome = { $regex: nome, $options: 'i' };

        // Adicionar filtro de preço
        if (minPrice || maxPrice) {
            query.preco = {};
            if (minPrice) query.preco.$gte = parseFloat(minPrice);
            if (maxPrice) query.preco.$lte = parseFloat(maxPrice);
        }

        // Ordenar produtos
        let sort = {};
        if (ordenar) {
            switch (ordenar) {
                case 'preco-asc':
                    sort.preco = 1;
                    break;
                case 'preco-desc':
                    sort.preco = -1;
                    break;
                case 'nome-asc':
                    sort.nome = 1;
                    break;
                case 'nome-desc':
                    sort.nome = -1;
                    break;
            }
        }

        const produtos = await Product.find(query).sort(sort);
        res.render('produtos', { produtos });
    } catch (error) {
        console.error('Erro ao exibir produtos:', error);
        res.render('erro', { mensagem: 'Erro ao exibir produtos.' });
    }
});

// Rota para obter imagens de uma marca específica
router.get('/produtos/imagens', async (req, res) => {
    try {
        const { marca } = req.query;
        if (!marca) {
            return res.status(400).json({ message: 'Marca não fornecida' });
        }

        // Buscar produtos da marca especificada
        const produtos = await Product.find({ marca });
        const imagens = produtos.flatMap(produto => produto.imagens); // Extrai todas as imagens

        res.json(imagens);
    } catch (error) {
        console.error('Erro ao buscar imagens de marca:', error);
        res.status(500).json({ message: 'Erro ao buscar imagens de marca' });
    }
});

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
