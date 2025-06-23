const express = require('express');
const router = express.Router();
const verPedidosController = require('../controllers/verPedidosController');

router.get('/', verPedidosController.getTodosPedidos);

module.exports = router;
