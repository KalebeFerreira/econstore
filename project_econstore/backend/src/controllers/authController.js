const UserModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AuthController = {
    async register(req, res) {
        try {
            const { nome_completo, cpf, telefone, email, senha, tipo_usuario, endereco_rua, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep } = req.body;

            // Validação básica de entrada
            if (!nome_completo || !cpf || !email || !senha) {
                return res.status(400).json({ message: "Nome completo, CPF, e-mail e senha são obrigatórios." });
            }
            // Adicionar mais validações conforme RN02 e outras regras de negócio
            // RN06 (E-mail Único) e unicidade de CPF são tratadas pelo model/DB

            const newUser = await UserModel.createUser({
                nome_completo,
                cpf,
                telefone,
                email,
                senha, // O hash é feito no model
                tipo_usuario: tipo_usuario || "cliente",
                endereco_rua,
                endereco_numero,
                endereco_complemento,
                endereco_bairro,
                endereco_cidade,
                endereco_estado,
                endereco_cep
            });

            res.status(201).json({ message: "Usuário registrado com sucesso!", userId: newUser.id_usuario });

        } catch (error) {
            console.error("Erro no registro: ", error);
            if (error.message.includes("cadastrado")) { // Erro customizado do model
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: "Erro interno do servidor ao tentar registrar usuário." });
        }
    },

    async login(req, res) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
            }

            const user = await UserModel.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({ message: "Credenciais inválidas (usuário não encontrado)." });
            }

            const isMatch = await bcrypt.compare(senha, user.senha);
            if (!isMatch) {
                return res.status(401).json({ message: "Credenciais inválidas (senha incorreta)." });
            }

            // RN03: O cliente deve estar autenticado para finalizar uma compra (gerar token)
            const payload = {
                id_usuario: user.id_usuario,
                email: user.email,
                tipo_usuario: user.tipo_usuario
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // Token expira em 1 hora

            res.status(200).json({
                message: "Login bem-sucedido!",
                token,
                user: {
                    id_usuario: user.id_usuario,
                    nome_completo: user.nome_completo,
                    email: user.email,
                    tipo_usuario: user.tipo_usuario
                }
            });

        } catch (error) {
            console.error("Erro no login: ", error);
            res.status(500).json({ message: "Erro interno do servidor ao tentar fazer login." });
        }
    }
    // Adicionar endpoint para validar token ou obter perfil do usuário logado, se necessário
};

module.exports = AuthController;

