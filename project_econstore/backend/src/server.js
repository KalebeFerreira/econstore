const express = require("express");
const cors = require("cors");
const { getPool } = require("./config/db");

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const verPedidosRoutes = require('./routes/verPedidosRoutes');
// const userRoutes = require("./routes/userRoutes"); // Ainda não criado
// const orderRoutes = require("./routes/orderRoutes"); // Ainda não criado

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para habilitar CORS
app.use(cors());

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Middleware para parsear dados de formulários URL-encoded
app.use(express.urlencoded({ extended: true }));

// Rota de teste inicial
app.get("/api", (req, res) => {
    res.json({ message: "Bem-vindo à API da Econstore!" });
});


app.use('/api/pedidos', pedidoRoutes);


app.use('/api', funcionarioRoutes);

app.use('/api/ver-pedidos', verPedidosRoutes);


const path = require("path");
app.use(express.static(path.join(__dirname, "../../frontend")));




// Configuração das rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/orders", orderRoutes);

// Middleware para tratamento de erros (exemplo básico)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Algo deu errado no servidor!");
});

// Função para iniciar o servidor
async function startServer() {
    try {
        // Garante que a conexão com o banco de dados seja estabelecida
        await getPool(); 
        console.log("Pool do banco de dados pronto.");

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Acesse em http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error("Falha ao iniciar o servidor:", error);
        process.exit(1); // Encerra a aplicação se não puder iniciar corretamente
    }
}

// Inicia o servidor
startServer();

module.exports = app;

