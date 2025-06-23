const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');

router.post('/login-funcionario', funcionarioController.loginFuncionario);

module.exports = router;
