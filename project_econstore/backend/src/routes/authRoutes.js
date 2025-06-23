const express = require("express");
const AuthController = require("../controllers/authController");

const router = express.Router();

// Rota para registrar um novo usuário (cliente ou lojista)
// POST /api/auth/register
router.post("/register", AuthController.register);

// Rota para login de usuário
// POST /api/auth/login
router.post("/login", AuthController.login);

// Futuramente, pode-se adicionar rotas para:
// - Validação de token
// - Recuperação de senha
// - Logout (se a gestão de token for no backend)

module.exports = router;

