const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    cpf: { type: String, required: true },
    address: {
        cep: { type: String, required: true },
        quadra: { type: String, required: true },
        bairro: { type: String, required: true },
        cidade: { type: String, required: true },
        estado: { type: String, required: true },
        numero: { type: String, required: true },
        complemento: { type: String }
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalPrice: { type: Number, required: true },
    orderStatus: {
        type: String,
        enum: ['Aguardando Pagamento', 'Pagamento Aprovado', 'Separando', 'Enviado', 'Em Trânsito', 'Entregue', 'Cancelado'],
        default: 'Aguardando Pagamento'
    },
    trackingCode: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
