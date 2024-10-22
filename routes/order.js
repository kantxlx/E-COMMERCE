const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Address = require('../models/Address');
const mercadopago = require('mercadopago');
const mongoose = require('mongoose');
const axios = require('axios');

// Middleware para garantir que o usuário esteja logado
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); // Redireciona para a página de login se não estiver autenticado
}

// Configurar credenciais do Mercado Pago
mercadopago.configure({
    access_token: 'APP_USR-826070934181283-100722-efff535b797ce5d20877b7753872e7f5-741852441'
});

// Rota para mostrar a tela de confirmação de pedido
router.get('/confirmar', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const addresses = await Address.find({ userId });

        const cart = req.session.cart || [];

        if (!cart || cart.length === 0) {
            return res.status(400).send('Carrinho vazio.');
        }

        res.render('confirmarPedido', {
            user,
            addresses,
            cart,
            total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        });
    } catch (error) {
        console.error('Erro ao carregar a tela de confirmação de pedido:', error);
        res.status(500).send('Erro no servidor');
    }
});

// Função para calcular frete usando a API do Melhor Envio com filtro para SEDEX
async function calculateShipping(address, cart) {
    console.log('Iniciando cálculo de frete...');
    console.log('Endereço:', address);
    console.log('Carrinho:', cart);

    const totalWeight = cart.reduce((acc, item) => acc + (1 * item.quantity), 0); // 1kg por item, ajuste conforme necessário
    console.log('Peso total calculado:', totalWeight, 'kg');

    const payload = {
        from: { postal_code: '01023001' }, // CEP de origem
        to: { postal_code: address.cep.replace('-', '') }, // CEP de destino
        products: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            weight: 1, // Peso do item em kg
            width: 10,
            height: 10,
            length: 16
        }))
    };

    console.log('Payload enviado para a API:', JSON.stringify(payload, null, 2));

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiOTFlYmIyMWNlNGIzNTQwMDA3YjM2MGFiY2VkNzg3MzkwY2JlY2I2ODFhOWE1YmIxY2U0MGJlMmViNDNiMDBlNWNmMGNlNThhZGJmOTIwNmEiLCJpYXQiOjE3Mjk0NDY0MjUuOTAzMjY0LCJuYmYiOjE3Mjk0NDY0MjUuOTAzMjY2LCJleHAiOjE3NjA5ODI0MjUuODg5OTA1LCJzdWIiOiI5Y2NlODIyYi02ZDQ4LTQ5NGMtODM3Mi1hYjBkNzUxODg2ZjAiLCJzY29wZXMiOlsiY2FydC1yZWFkIiwiY2FydC13cml0ZSIsImNvbXBhbmllcy1yZWFkIiwiY29tcGFuaWVzLXdyaXRlIiwiY291cG9ucy1yZWFkIiwiY291cG9ucy13cml0ZSIsIm5vdGlmaWNhdGlvbnMtcmVhZCIsIm9yZGVycy1yZWFkIiwicHJvZHVjdHMtcmVhZCIsInByb2R1Y3RzLWRlc3Ryb3kiLCJwcm9kdWN0cy13cml0ZSIsInB1cmNoYXNlcy1yZWFkIiwic2hpcHBpbmctY2FsY3VsYXRlIiwic2hpcHBpbmctY2FuY2VsIiwic2hpcHBpbmctY2hlY2tvdXQiLCJzaGlwcGluZy1jb21wYW5pZXMiLCJzaGlwcGluZy1nZW5lcmF0ZSIsInNoaXBwaW5nLXByZXZpZXciLCJzaGlwcGluZy1wcmludCIsInNoaXBwaW5nLXNoYXJlIiwic2hpcHBpbmctdHJhY2tpbmciLCJlY29tbWVyY2Utc2hpcHBpbmciLCJ0cmFuc2FjdGlvbnMtcmVhZCIsInVzZXJzLXJlYWQiLCJ1c2Vycy13cml0ZSIsIndlYmhvb2tzLXJlYWQiLCJ3ZWJob29rcy13cml0ZSIsIndlYmhvb2tzLWRlbGV0ZSIsInRkZWFsZXItd2ViaG9vayJdfQ.DZjDWaQvsPiPfuMFBM1UWMdSkpDzqOm2Zzn_ImpZz0uzDkeGzHFCRpjHUwzF0juxVPlYDwCjTSKfwmyryUCG82gKb6KlB_dB23epzrKmpdwN99La9Hfs0kWxP82Hig6q3n6wC-ZPFzul7Pc7pmxunICOMc0I-UWoqUqrXMObhdcqDvtGSH90WooYYBc0qH6d9dunDE8OglKEbJJl6j1PgVW1lET9zV83-cRq-W_olFUBqbxxpiD4byQBxMo45xvuRRqHfs-lvYV1guAm2QN3Cda80QdPrlZ2Mb0ONhmDdHNlnOSeRBwhJvPEnkmoeedcwKYbpFsKgMmxtP35t7JU9djiwjOAW6X3OVm1ts3Bx99HsCWQ29MR4UuPvpd0EMBWm_aEcmXgyhO7-rlgl7JiANEthYS0LhFytIvfzsFKXsmfsdPVctZLkjh14KhYQJ1_KhrkOVqEEIik-ZMqt9WUOyw4DReFcZI8bmFw0Tn3mT0BVlynz-6pNEvBMCIbfxnnetYWyLi1GuKv1tIkFjB_ntjZ_IySSRGcHEvslOEo-9tFd-VZBP69G4-0GJkZmwgZNggCQoed2wzkl5xWRdBYJkiQxgsbKWnjAqFOX7lEgPALqH0DX75ngFqvTZIjDAVZxr79ScFU4UY9aEtQPR9wA3kobaUf_ljXQytIxjNKK3Q', // Token da API
    };

    try {
        console.log('Enviando requisição para a API do Melhor Envio...');
        const response = await axios.post('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', payload, { headers });
        
        console.log('Resposta da API Melhor Envio:', response.data);
        const shippingOptions = response.data;

        if (shippingOptions && shippingOptions.length > 0) {
            console.log('Opções de frete disponíveis:', shippingOptions);

            // Filtra apenas opções do SEDEX
            const sedexOption = shippingOptions.find(option => option.name.includes('SEDEX'));

            if (sedexOption) {
                console.log('Opção de frete SEDEX selecionada:', sedexOption);

                return {
                    shippingCost: sedexOption.price,
                    deliveryTime: sedexOption.delivery_time
                };
            } else {
                console.warn('Nenhuma opção SEDEX disponível.');
                throw new Error('Nenhuma opção SEDEX disponível.');
            }
        } else {
            console.warn('Nenhuma opção de frete encontrada.');
            throw new Error('Nenhuma opção de frete encontrada.');
        }
    } catch (error) {
        console.error('Erro ao calcular frete:', error);
        console.error('Detalhes do erro:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Rota para calcular frete
router.post('/calculate-shipping', ensureAuthenticated, async (req, res) => {
    console.log('Rota /calculate-shipping chamada...');
    const { address, cart } = req.body;

    console.log('Endereço recebido:', address);
    console.log('Carrinho recebido:', cart);

    try {
        const { shippingCost, deliveryTime } = await calculateShipping(address, cart);
        console.log('Custo de frete calculado:', shippingCost);
        console.log('Tempo de entrega calculado:', deliveryTime);

        res.json({ shippingCost, deliveryTime });
    } catch (error) {
        console.error('Erro na resposta da rota /calculate-shipping:', error.message);
        res.status(500).json({ message: 'Erro ao calcular o frete.', error: error.message });
    }
});

// Função para criar a preferência de pagamento
async function createPaymentPreference(order) {
    // Populando os itens do pedido
    const populatedOrder = await Order.findById(order._id).populate({
        path: 'items.productId',
        select: 'name description', // Certifique-se de que o nome e a descrição estão sendo selecionados
    });

    // Log para verificar o que foi recuperado, incluindo o produto
    console.log('Pedido populado:', populatedOrder);
    console.log('Itens do pedido:', populatedOrder.items);

    const preference = {
        items: [
            {
                title: `Pedido: ${order._id}`,  // Exibindo o ID do pedido
                quantity: 1, // Define quantidade como 1 para representar o pedido em si
                currency_id: 'BRL',
                unit_price: populatedOrder.totalPrice, // Total do pedido
            }
        ],
        payer: {
            name: order.name,
            email: order.email,
            phone: {
                area_code: '55',
                number: parseInt(order.phone),
            },
            identification: {
                type: 'CPF',
                number: order.cpf,
            },
            address: {
                street_name: order.address.logradouro,
                street_number: parseInt(order.address.numero),
                zip_code: order.address.cep,
                neighborhood: order.address.bairro,
                city: order.address.cidade,
                state: order.address.estado,
            },
        },
        back_urls: {
            success: 'http://localhost:3001/success',
            failure: 'http://localhost:3001/failure',
            pending: 'http://localhost:3001/pending',
        },
        auto_return: 'approved',
        external_reference: order._id.toString(), // Aqui adiciona o ID do pedido
    };

    const response = await mercadopago.preferences.create(preference);
    return response.body;
}

//rota para finalizar a compra
router.post('/finalizar', ensureAuthenticated, async (req, res) => {
    try {
        const { name, email, phone, cpf, address } = req.body;

        console.log('Dados recebidos do cliente:', req.body);

        if (!name || !email || !phone || !cpf || !address) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const userId = req.user._id;
        const cart = req.session.cart || [];

        if (cart.length === 0) {
            return res.status(400).json({ message: 'O carrinho está vazio.' });
        }

        // Calcula o total dos itens no carrinho
        const totalPriceItems = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
        console.log('Preço Total dos Itens:', totalPriceItems);

        // Calcula o frete
        const { shippingCost } = await calculateShipping(address, cart);
        console.log('Custo de Frete:', shippingCost);

        // Soma o preço total dos itens com o frete
        const totalPrice = totalPriceItems + parseFloat(shippingCost);
        console.log('Preço Total com Frete:', totalPrice);

        // Criando novo pedido
        const newOrder = new Order({
            userId,
            name,
            email,
            phone: parseInt(phone),
            cpf,
            address: {
                ...address,
                numero: parseInt(address.numero),
            },
            items: cart,
            totalPrice,
        });

        const savedOrder = await newOrder.save();
        console.log('Pedido salvo:', savedOrder);

        // Limpar o carrinho após a finalização do pedido
        req.session.cart = [];

        // Criar preferência de pagamento
        const paymentPreference = await createPaymentPreference(savedOrder);

        res.status(200).json({
            _id: savedOrder._id,
            paymentLink: paymentPreference.init_point,
        });

    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        res.status(500).json({ message: 'Erro ao criar o pedido.', error: error.message });
    }
});

// Rota para visualizar todos os pedidos do usuário
router.get('/meusPedidos', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({ userId });
        res.render('meusPedidos', { orders });
    } catch (error) {
        console.error('Erro ao carregar os pedidos:', error);
        res.status(500).send('Erro ao carregar os pedidos.');
    }
});

// Rota para exibir os detalhes de um pedido específico
router.get('/detalhesPedido/:id', ensureAuthenticated, async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Verifica se o ID é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).send('ID inválido.');
        }

        const order = await Order.findById(orderId).populate('items.productId');
        if (!order || order.userId.toString() !== req.user._id.toString()) {
            return res.status(404).send('Pedido não encontrado.');
        }
        res.render('detalhesPedido', { order });
    } catch (error) {
        console.error('Erro ao carregar detalhes do pedido:', error);
        res.status(500).send('Erro ao carregar detalhes do pedido.');
    }
});

// Rota para reprocessar o pagamento
router.post('/detalhesPedido/:orderId/reprocessar', ensureAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;

        // Recupere o pedido do banco de dados
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Pedido não encontrado.');
        }

        // Criar a preferência de pagamento
        const paymentPreference = await createPaymentPreference(order);

        // Redireciona o usuário para o link de pagamento
        res.redirect(paymentPreference.init_point);
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        res.status(500).send('Erro ao processar pagamento.');
    }
});

// Rota para cancelar um pedido
router.post('/cancelar/:id', ensureAuthenticated, async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order || order.userId.toString() !== req.user._id.toString()) {
            return res.status(404).send('Pedido não encontrado.');
        }

        // Verificar se o status do pedido permite o cancelamento
        if (order.orderStatus !== 'Aguardando Pagamento' && order.orderStatus !== 'Separando') {
            return res.status(400).send('Este pedido não pode ser cancelado.');
        }

        // Lógica para cancelar o pedido
        order.orderStatus = 'Cancelado';
        await order.save();
        
        // Remover o pedido da lista de pedidos
        res.status(200).send('Pedido cancelado com sucesso.');
    } catch (error) {
        console.error('Erro ao cancelar o pedido:', error);
        res.status(500).send('Erro ao cancelar o pedido.');
    }
});

// Rota para notificação de pagamento
router.post('/notificacao-pagamento', async (req, res) => {
    try {
        const { id } = req.body; // Recebe o ID da preferência

        // Verifique se o ID está presente
        if (!id) {
            console.error('ID da preferência não recebido.');
            return res.sendStatus(400); // Responde com erro
        }

        const paymentInfo = await mercadopago.payment.get(id); // Obtém informações sobre o pagamento

        // Verifique se o status do pagamento é 'approved'
        if (paymentInfo.status === 'approved') {
            // Atualiza o pedido no banco de dados
            const order = await Order.findOneAndUpdate(
                { external_reference: paymentInfo.external_reference },
                { orderStatus: 'Pagamento Aprovado' },
                { new: true }
            );

            if (order) {
                console.log('Pedido atualizado:', order);
            } else {
                console.error('Pedido não encontrado para o ID:', paymentInfo.external_reference);
            }
        }

        res.sendStatus(200); // Responde com sucesso
    } catch (error) {
        console.error('Erro ao processar notificação de pagamento:', error);
        res.sendStatus(500); // Responde com erro
    }
});

// Exportar o router
module.exports = router;
