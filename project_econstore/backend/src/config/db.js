require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', // Substitua pelo seu usuário do MySQL
    password: process.env.DB_PASSWORD || '', // Substitua pela sua senha do MySQL
    database: process.env.DB_NAME || 'econstore_db', // Nome do banco de dados que será criado/usado
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Função para criar o banco de dados se não existir
async function initializeDatabase() {
    try {
        // Conexão sem especificar o banco de dados para poder criá-lo
        const connectionForCreation = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });
        await connectionForCreation.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connectionForCreation.end();
        console.log(`Banco de dados '${dbConfig.database}' verificado/criado com sucesso.`);
    } catch (error) {
        console.error("Erro ao inicializar o banco de dados:", error);
        // Se houver erro na criação (ex: acesso negado), o pool abaixo também falhará ao conectar.
        // Considere lançar o erro ou tratar de forma mais robusta.
        process.exit(1); // Encerra a aplicação se não puder criar/conectar ao DB
    }
}

// Pool de conexões principal
let pool;

async function getPool() {
    if (!pool) {
        await initializeDatabase(); // Garante que o DB exista antes de criar o pool
        pool = mysql.createPool(dbConfig);

        // Teste de conexão
        try {
            const connection = await pool.getConnection();
            console.log("Conexão com o banco de dados MySQL estabelecida com sucesso!");
            connection.release();
        } catch (error) {
            console.error("Erro ao conectar com o banco de dados MySQL:", error);
            pool = null; // Reseta o pool em caso de falha para tentar novamente
            throw error; // Lança o erro para que a aplicação saiba que a conexão falhou
        }
    }
    return pool;
}

module.exports = { getPool };

