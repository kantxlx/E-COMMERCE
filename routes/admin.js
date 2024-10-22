const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order')
const flash = require('connect-flash');
const session = require('express-session');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');

// Configuração do multer para upload de arquivos
const uploadDirectory = path.join(__dirname, '../public/uploads');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Configuração de sessão e flash
router.use(session({
    secret: 'secreta',
    resave: false,
    saveUninitialized: true
}));
router.use(flash());

// Rota para exibir a página de administração (protegida)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.render('admin', { products, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
        req.flash('error', 'Erro ao carregar produtos');
        res.redirect('/admin');
    }
});

// Rota para adicionar produto
router.get('/add-product', (req, res) => {
    res.render('add-product', { success: req.flash('success'), error: req.flash('error') });
});

router.post('/add-product', upload.fields([{ name: 'imagens', maxCount: 5 }, { name: 'imagemCapa' }]), async (req, res) => {
    try {
        const { nome, descricao, preco, categoria, 'preco-antigo': precoAntigo, marca } = req.body;

        const existingProduct = await Product.findOne({ nome });
        if (existingProduct) {
            req.flash('error', 'Já existe um produto com este nome.');
            return res.redirect('/admin/add-product');
        }

        const imagens = req.files['imagens'] ? req.files['imagens'].map(file => file.filename) : [];
        const imagemCapa = req.files['imagemCapa'] ? req.files['imagemCapa'][0].filename : null; // Adicionando a imagem de capa

        const produto = new Product({
            nome,
            descricao,
            preco,
            categoria,
            precoAntigo: categoria === 'ofertas' ? precoAntigo : null,
            imagens,
            imagemCapa, // Armazenando a imagem de capa
            marca
        });

        await produto.save();

        req.flash('success', 'Produto adicionado com sucesso!');
        res.redirect('/admin');
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        req.flash('error', 'Erro ao adicionar produto. Tente novamente.');
        res.redirect('/admin/add-product');
    }
});

// Rota para exibir o formulário de edição de um produto específico
router.get('/edit-product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Produto não encontrado');
            return res.redirect('/admin/edit-products');
        }
        res.render('edit-product', { product });
    } catch (error) {
        req.flash('error', 'Erro ao exibir produto');
        res.redirect('/admin/edit-products');
    }
});

// Rota para exibir e buscar/ordenar produtos
router.get('/edit-products', async (req, res) => {
    try {
        const { nome, ordenar } = req.query;
        let query = {};
        let sort = {};

        // Se o parâmetro de busca estiver presente, adicionar ao filtro
        if (nome) {
            query.nome = new RegExp(nome, 'i'); // Busca "case insensitive"
        }

        // Se o parâmetro de ordenação estiver presente, definir a ordenação
        if (ordenar) {
            switch (ordenar) {
                case 'nome-asc':
                    sort.nome = 1; // Ordem crescente
                    break;
                case 'nome-desc':
                    sort.nome = -1; // Ordem decrescente
                    break;
                case 'preco-asc':
                    sort.preco = 1; // Ordem crescente
                    break;
                case 'preco-desc':
                    sort.preco = -1; // Ordem decrescente
                    break;
                default:
                    break;
            }
        }

        // Buscar produtos com base nos filtros e ordenação
        const products = await Product.find(query).sort(sort);
        
        // Renderizar a página de edição com os produtos filtrados e ordenados
        res.render('edit-products', { products, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        req.flash('error', 'Erro ao carregar produtos');
        res.redirect('/admin');
    }
});

// Rota para excluir produto
router.post('/delete-product/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            req.flash('error', 'Produto não encontrado');
            return res.redirect('/admin/edit-products');
        }

        req.flash('success', 'Produto excluído com sucesso!');
        res.redirect('/admin/edit-products');
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        req.flash('error', 'Erro ao excluir produto. Tente novamente.');
        res.redirect('/admin/edit-products');
    }
});

// Rota para visualizar todos os usuários
router.get('/management-users', async (req, res) => {
    try {
        const { search, clear } = req.query; // Obtendo a query de busca e a query de limpar

        let users;

        // Se 'clear' for passado na query, ignora a busca e retorna todos os usuários
        if (clear) {
            users = await User.find(); // Retorna todos os usuários
        } else if (search) {
            // Filtra os usuários se a busca for fornecida
            users = await User.find({ email: new RegExp(search, 'i') }); // Regex para busca case-insensitive
        } else {
            users = await User.find(); // Retorna todos os usuários se não houver busca
        }

        // Renderiza a página com os usuários encontrados
        res.render('management-users', { users, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        req.flash('error', 'Erro ao carregar usuários');
        res.redirect('/admin'); // Redireciona em caso de erro
    }
});

// Rota para editar a senha do usuário
router.get('/edit-user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/admin/management-users');
        }
        res.render('edit-user', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/update-user/:id', async (req, res) => {
    try {
        const { password , confirmPassword } = req.body;

        if (password !== confirmPassword) {
            req.flash('error', "As senhas não coincidem.");
            return res.redirect(`/admin/edit-user/${req.params.id}`);
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/admin/management-users');
        }

        if (password) {
            user.password = password;
        }

        await user.save();
        req.flash('success_msg', 'User updated successfully');
        res.redirect('/admin/management-users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/edit-user/:id', async (req, res) => {
    try {
        const { password } = req.body;
        
        // Verifica se foi fornecida uma nova senha
        if (password && password.length >= 6) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
            req.flash('success', 'Senha atualizada com sucesso!');
        } else {
            req.flash('error', 'A senha deve ter pelo menos 6 caracteres');
        }
        res.redirect('/admin/management-users');
    } catch (error) {
        req.flash('error', 'Erro ao atualizar senha. Tente novamente.');
        res.redirect(`/admin/edit-user/${req.params.id}`);
    }
});

// Rota para excluir conta do usuário
router.post('/delete-user/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            req.flash('error', 'Usuário não encontrado');
            return res.redirect('/admin/management-users');
        }
        req.flash('success', 'Usuário excluído com sucesso');
        res.redirect('/admin/management-users');
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        req.flash('error', 'Erro ao excluir usuário. Tente novamente.');
        res.redirect('/admin/management-users');
    }
});

// Rota para visualizar a lista de pedidos
router.get('/adminPedidos', async (req, res) => {
    try {
        const orders = await Order.find().populate('userId'); // Popula com informações do usuário
        res.render('adminPedidos', { orders, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        req.flash('error', 'Erro ao carregar pedidos.');
        res.redirect('/admin');
    }
});

// Rota para visualizar detalhes de um pedido específico
router.get('/management-pedidos/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.productId');
        console.log(order); // Verifique se os dados estão corretos
        res.render('management-pedidos', { order });
    } catch (error) {
        console.error('Erro ao carregar pedido:', error);
        req.flash('error', 'Erro ao carregar pedido.');
        res.redirect('/admin/adminPedidos');
    }
});

// Rota para excluir pedido
router.post('/delete-order/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            req.flash('error', 'Pedido não encontrado');
            return res.redirect('/admin/adminPedidos');
        }
        req.flash('success', 'Pedido excluído com sucesso!');
        res.redirect('/admin/adminPedidos');
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        req.flash('error', 'Erro ao excluir pedido. Tente novamente.');
        res.redirect('/admin/adminPedidos');
    }
});

// Rota para atualizar o status do pedido
router.post('/update-order-status/:id', async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true });
        if (!order) {
            req.flash('error', 'Pedido não encontrado');
            return res.redirect('/admin/adminPedidos');
        }
        req.flash('success', 'Status do pedido atualizado com sucesso!');
        res.redirect('/admin/adminPedidos');
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);
        req.flash('error', 'Erro ao atualizar status do pedido. Tente novamente.');
        res.redirect('/admin/adminPedidos');
    }
});

// Atualizar o código de rastreamento de um pedido
router.post('/update-tracking-code/:id', async (req, res) => {
    try {
        const { trackingCode } = req.body; // Recebe o código de rastreamento do formulário
        const orderId = req.params.id;     // Recebe o ID do pedido da URL

        // Atualiza o código de rastreamento do pedido no banco de dados
        await Order.findByIdAndUpdate(orderId, { trackingCode });

        req.flash('success', 'Código de rastreamento atualizado com sucesso!');
        res.redirect('/admin/adminPedidos'); // Redireciona para a página de gerenciamento de pedidos
    } catch (error) {
        console.error(error);
        req.flash('error', 'Erro ao atualizar o código de rastreamento.');
        res.redirect('/admin/adminPedidos');
    }
});

// Rota para baixar o pedido em formato PDF
// Rota para baixar o pedido em formato PDF
router.get('/download-pedido/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('userId').populate('items.productId'); // Garanta que o produto está sendo populado
        if (!order) {
            req.flash('error', 'Pedido não encontrado');
            return res.redirect('/admin/adminPedidos');
        }

        // Cria um novo documento PDF
        const doc = new PDFDocument();

        // Nome do arquivo
        const fileName = `pedido_${order._id}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-type', 'application/pdf');

        // Pipe o documento para a resposta
        doc.pipe(res);

        // Adiciona conteúdo ao PDF
        doc.fontSize(20).text(`Detalhes do Pedido ${order._id}`, { align: 'center' });
        doc.moveDown();

        // Informações do cliente
        doc.fontSize(14).text(`Nome: ${order.name}`);
        doc.text(`Email: ${order.email}`);
        doc.text(`Telefone: ${order.phone}`);
        doc.text(`CPF: ${order.cpf}`);
        doc.moveDown();

        // Endereço
        doc.text(`Endereço:`);
        doc.text(`CEP: ${order.address.cep}`);
        doc.text(`Quadra: ${order.address.quadra}`);
        doc.text(`Bairro: ${order.address.bairro}`);
        doc.text(`Cidade: ${order.address.cidade}`);
        doc.text(`Estado: ${order.address.estado}`);
        doc.text(`Número: ${order.address.numero}`);
        doc.text(`Complemento: ${order.address.complemento || 'N/A'}`);
        doc.moveDown();

        // Itens do Pedido
        doc.text(`Itens do Pedido:`);
        order.items.forEach(item => {
            console.log('Item:', item); // Adicione isso para verificar o item
            console.log('Produto:', item.productId); // Adicione isso para verificar o produto

            const productName = item.productId.nome; // Altere para o nome correto se necessário
            doc.text(`Produto: ${productName || 'Nome não encontrado'}, Quantidade: ${item.quantity}, Preço: R$ ${item.price.toFixed(2)}`);
        });
        doc.moveDown();

        // Data da Compra e Status do Pedido
        doc.text(`Data da Compra: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}`);
        doc.text(`Status do Pedido: ${order.orderStatus}`);
        doc.moveDown();

        // Total do Pedido
        doc.text(`Total do Pedido: R$ ${order.totalPrice.toFixed(2)}`);

        // Finaliza o documento
        doc.end();

    } catch (error) {
        console.error('Erro ao gerar PDF do pedido:', error);
        req.flash('error', 'Erro ao gerar PDF do pedido.');
        res.redirect('/admin/adminPedidos');
    }
});


module.exports = router;
