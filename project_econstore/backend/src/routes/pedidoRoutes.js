// routes/pedidoRoutes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/', authenticateToken, pedidoController.criarPedido);
 // ← Corrigido aqui

module.exports = router;