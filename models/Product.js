const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    nome: String,
    descricao: String,
    preco: Number,
    precoAntigo: Number,
    categoria: {
        type: String,
        enum: ['ofertas', 'novidades', 'outras'],
        default: 'outras'
    },
    marca: {
        type: String, // Adiciona o campo marca
        enum: ['omega', 'hublot', 'audemars-piguet', 'rolex', 'breitling', 'cartier', 'michael-kors', 'panerai', 'tag-heuer', 'patek-philippe'], // Enum opcional para limitar valores
        default: 'outra'
    },
    imagemCapa: String,
    imagens: [String]
});

module.exports = mongoose.model('Product', productSchema);
