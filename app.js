require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const mercadopago = require('mercadopago');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Product = require('./models/Product');
const Pedido = require('./models/Order');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const userRoutes = require('./routes/userRoutes');
const addressRoutes = require('./routes/addressRoutes');
const paymentRoutes = require('./routes/payment');
const path = require('path');

const app = express();

// Configurar as credenciais do Mercado Pago
mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN // Adicione sua chave de acesso aqui
});

// Conectar ao MongoDB
console.log('Mongo URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Configurar sessão
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'Kalegacy4321',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(methodOverride('_method'));

// Configuração do Passport
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) return done(null, false, { message: 'Usuário não encontrado' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: 'Senha incorreta' });
        
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user));
});

// Configurar Middleware
app.use(express.static('public'));

// Configurar view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para salvar a URL original
app.use((req, res, next) => {
    if (!req.isAuthenticated() && req.path === '/cart') {
        req.session.redirectTo = req.originalUrl; // Armazena a URL de origem
    }
    next();
});

// Middleware para proteger rotas de administração
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error', 'Você precisa estar logado para acessar esta página.');
        return res.redirect('/login');
    }
}

// Middleware para proteger a rota de administrador
function isAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        // Verifica apenas o email do admin
        const adminEmail = '1234@gmail.com';

        if (req.user.email === adminEmail) {
            return next(); // Permite o acesso à rota /admin
        } else {
            return res.redirect('/timeout');
        }
    } else {
        req.flash('error', 'Você precisa estar logado para acessar esta página.');
        return res.redirect('/login');
    }
}

// Rotas
app.use('/', authRoutes); // Certifique-se de que esta rota inclui a rota de login
app.use('/', productRoutes); // Certifique-se de que o prefixo está correto
app.use('/user', userRoutes); // Rotas de edição de usuário
app.use('/cart', cartRoutes); // Permite acesso ao carrinho para todos
app.use('/order', orderRoutes); // Adiciona as rotas de pedidos
app.use('/addresses', addressRoutes);
app.use('/api/payment', paymentRoutes); // Usar as rotas de pagamento como API

// Rota de sucesso
app.get('/success', async (req, res) => {
    const orderId = req.query.orderId;

    if (!orderId) {
        return res.status(400).send('ID do pedido não foi fornecido.');
    }

    // Verifique se o pedido foi criado corretamente com os dados esperados
    const order = await Pedido.create({
        userId: req.session.userId, // Supondo que você tenha uma sessão configurada
        items: req.body.cartItems,  // Isso pode depender de como o seu carrinho é estruturado
        paymentId: orderId,
        status: 'approved',
    });

    res.redirect(`/order/detalhesPedido/${order._id}`); // Use o ID do pedido criado
});

// Rota de falha
app.get('/failure', (req, res) => {
    const orderId = req.query.orderId;
    if (!orderId) {
        return res.status(400).send('ID do pedido não foi fornecido.');
    }
    res.redirect(`/order/detalhesPedido/${orderId}`);
});

// Rota de pendente
app.get('/pending', (req, res) => {
    const orderId = req.query.orderId;
    if (!orderId) {
        return res.status(400).send('ID do pedido não foi fornecido.');
    }
    res.redirect(`/order/detalhesPedido/${orderId}`);
});

// Proteger rotas de administração
app.use('/admin', isAuthenticated, isAdmin, adminRoutes);

app.get('/timeout', (req, res) => {
    res.send('Página não encontrada.');
});

// Rota para a página principal
app.get('/', async (req, res) => {
    try {
        // Obter produtos de ofertas e novidades
        const ofertas = await Product.find({ category: 'ofertas' }).limit(8);
        const novidades = await Product.find({ category: 'novidades' }).limit(8);

        res.render('index', { ofertas, novidades });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar a página');
    }
});

// Rota de teste
app.get('/teste', (req, res) => {
    res.render('test', { message: 'Teste de renderização' });
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo quebrou!');
});

// Rota de login
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) return next(err);

            // Verifique o conteúdo de req.user
            console.log("Usuário logado:", user);

            // Verifica se o usuário é o administrador e redireciona para /admin
            if (user.email === '1234@gmail.com') {
                return res.redirect('/admin');
            }

            // Caso contrário, redireciona para a URL original ou para a página inicial
            const redirectUrl = req.session.redirectTo || '/';
            delete req.session.redirectTo; // Limpa a URL após redirecionar
            return res.redirect(redirectUrl);
        });
    })(req, res, next);
});

// Rota de registro (adicionada)
app.post('/register', async (req, res) => {
    const { name, email, password, securityQuestion, securityAnswer } = req.body;
    try {
        await registerUser(name, email, password, securityQuestion, securityAnswer);
        res.redirect('/login'); // Redireciona para a página de login após registro
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/register'); // Redireciona de volta para a página de registro em caso de erro
    }
});

// Função para registrar um novo usuário
async function registerUser(name, email, password, securityQuestion, securityAnswer) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('Usuário já existe com este email.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const securityAnswerHash = await bcrypt.hash(securityAnswer, 10);

    const newUser = new User({
        name,
        email,
        password: passwordHash,
        securityQuestion,
        securityAnswer: securityAnswerHash,
    });

    await newUser.save();
    console.log('Usuário registrado com sucesso.');
}

// Rota de perfil (incluindo pedidos)
app.get('/perfil', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const pedidos = await Pedido.find({ userId: user._id });
        res.render('perfil', { user, pedidos, error: null }); // Adiciona error como null
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        res.render('perfil', { user: null, pedidos: [], error: 'Erro ao carregar perfil.' }); // Passa a mensagem de erro
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
