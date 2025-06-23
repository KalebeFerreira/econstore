const { getPool } = require("../config/db");

const ProductModel = {
    async createProduct(productData) {
        const pool = await getPool();
        const { nome_produto, descricao, preco, quantidade_estoque, id_categoria, imagem_url } = productData;
        const sql = `
            INSERT INTO Produtos (nome_produto, descricao, preco, quantidade_estoque, id_categoria, imagem_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [nome_produto, descricao, preco, quantidade_estoque, id_categoria, imagem_url];
        try {
            const [result] = await pool.query(sql, values);
            return { id_produto: result.insertId, nome_produto };
        } catch (error) {
            console.error("Erro ao criar produto no banco de dados:", error);
            throw error;
        }
    },

    async getAllProducts(filters = {}) {
        const pool = await getPool();
        let sql = "SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE 1=1";
        const params = [];

        if (filters.categoria) {
            sql += " AND c.nome_categoria = ?";
            params.push(filters.categoria);
        }
        if (filters.nome_produto) {
            sql += " AND p.nome_produto LIKE ?";
            params.push(`%${filters.nome_produto}%`);
        }
        // Adicionar paginação se necessário no futuro

        try {
            const [rows] = await pool.query(sql, params);
            return rows;
        } catch (error) {
            console.error("Erro ao buscar todos os produtos:", error);
            throw error;
        }
    },

    async getProductById(id_produto) {
        const pool = await getPool();
        const sql = "SELECT p.*, c.nome_categoria FROM Produtos p LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria WHERE p.id_produto = ?";
        try {
            const [rows] = await pool.query(sql, [id_produto]);
            return rows[0];
        } catch (error) {
            console.error("Erro ao buscar produto por ID:", error);
            throw error;
        }
    },

    async updateProduct(id_produto, productData) {
        const pool = await getPool();
        const { nome_produto, descricao, preco, quantidade_estoque, id_categoria, imagem_url } = productData;
        const sql = `
            UPDATE Produtos SET 
            nome_produto = ?, 
            descricao = ?, 
            preco = ?, 
            quantidade_estoque = ?, 
            id_categoria = ?, 
            imagem_url = ?
            WHERE id_produto = ?
        `;
        const values = [nome_produto, descricao, preco, quantidade_estoque, id_categoria, imagem_url, id_produto];
        try {
            const [result] = await pool.query(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            throw error;
        }
    },

    async deleteProduct(id_produto) {
        const pool = await getPool();
        const sql = "DELETE FROM Produtos WHERE id_produto = ?";
        try {
            const [result] = await pool.query(sql, [id_produto]);
            return result.affectedRows > 0;
        } catch (error) {
            // Verificar se o erro é de chave estrangeira (produto em pedido)
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error("Não é possível excluir o produto pois ele está associado a um ou mais pedidos.");
            }
            console.error("Erro ao deletar produto:", error);
            throw error;
        }
    },

    async updateStock(id_produto, quantityChange, conn = null) {
        console.log("Entrou no updateStock - id_produto:", id_produto, " - quantidade:", quantityChange);
    const pool = await getPool();
    const connection = conn || await pool.getConnection();
    const sql = `
        UPDATE Produtos 
        SET quantidade_estoque = quantidade_estoque + ? 
        WHERE id_produto = ? AND quantidade_estoque + ? >= 0
    `;

    try {
        const [result] = await connection.query(sql, [quantityChange, id_produto, quantityChange]);

        if (result.affectedRows === 0) {
            const product = await this.getProductById(id_produto);
            if (product && product.quantidade_estoque + quantityChange < 0) {
                throw new Error("Estoque insuficiente.");
            }
            throw new Error("Não foi possível atualizar o estoque do produto ou produto não encontrado.");
        }

        return true;
    } catch (error) {
        console.error("Erro ao atualizar estoque do produto:", error);
        throw error;
    } finally {
        if (!conn) connection.release(); // Só libera se criou internamente
    }
}

};

module.exports = ProductModel;

