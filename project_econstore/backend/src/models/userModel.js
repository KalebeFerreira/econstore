const { getPool } = require("../config/db");
const bcrypt = require("bcryptjs");

const UserModel = {
    async createUser(userData) {
        const pool = await getPool();
        const { nome_completo, cpf, telefone, email, senha, tipo_usuario, endereco_rua, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep } = userData;

        // Hash da senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        const sql = `
            INSERT INTO Usuarios 
            (nome_completo, cpf, telefone, email, senha, tipo_usuario, endereco_rua, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [nome_completo, cpf, telefone, email, hashedPassword, tipo_usuario || "cliente", endereco_rua, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep];

        try {
            const [result] = await pool.query(sql, values);
            return { id_usuario: result.insertId, email };
        } catch (error) {
            console.error("Erro ao criar usuário no banco de dados:", error);
            // Tratar erros específicos, como e-mail ou CPF duplicado (ER_DUP_ENTRY)
            if (error.code === "ER_DUP_ENTRY") {
                if (error.message.includes("email")) {
                    throw new Error("E-mail já cadastrado.");
                }
                if (error.message.includes("cpf")) {
                    throw new Error("CPF já cadastrado.");
                }
            }
            throw error; // Lança outros erros
        }
    },

    async findUserByEmail(email) {
        const pool = await getPool();
        const sql = "SELECT * FROM Usuarios WHERE email = ?";
        try {
            const [rows] = await pool.query(sql, [email]);
            return rows[0]; // Retorna o primeiro usuário encontrado ou undefined
        } catch (error) {
            console.error("Erro ao buscar usuário por e-mail:", error);
            throw error;
        }
    },

    async findUserById(id_usuario) {
        const pool = await getPool();
        const sql = "SELECT id_usuario, nome_completo, email, tipo_usuario, cpf, telefone, endereco_rua, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, data_cadastro FROM Usuarios WHERE id_usuario = ?";
        try {
            const [rows] = await pool.query(sql, [id_usuario]);
            return rows[0];
        } catch (error) {
            console.error("Erro ao buscar usuário por ID:", error);
            throw error;
        }
    }
    // Outros métodos do modelo de usuário podem ser adicionados aqui (ex: updateUser, deleteUser)
};

module.exports = UserModel;

