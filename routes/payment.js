const express = require('express');
const router = express.Router();
const mercadopago = require('mercadopago');
const Order = require('../models/Order');

// Configure Mercado Pago credentials
mercadopago.configure({
    access_token: 'APP_USR-826070934181283-100722-efff535b797ce5d20877b7753872e7f5-741852441'
});

module.exports = router;
