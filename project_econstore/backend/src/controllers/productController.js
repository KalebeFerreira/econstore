const ProductModel = require("../models/productModel");

const ProductController = {
    async createProduct(req, res) {
         console.log("🔧 Rota POST /api/products chamada");
        try {
            // RN1: Apenas o lojista pode cadastrar, editar e excluir produtos
            // Esta verificação de permissão deve ser feita por um middleware (adminMiddleware)
            const productData = req.body;
            if (!productData.nome_produto || !productData.preco || productData.quantidade_estoque === undefined) {
                return res.status(400).json({ message: "Nome do produto, preço e quantidade em estoque são obrigatórios." });
            }

            const newProduct = await ProductModel.createProduct(productData);
            res.status(201).json({ message: "Produto criado com sucesso!", product: newProduct });
        } catch (error) {
            console.error("Erro ao criar produto: ", error);
            res.status(500).json({ message: "Erro interno do servidor ao tentar criar produto." });
        }
    },

    async getAllProducts(req, res) {
        try {
            const filters = req.query; // Ex: /api/products?categoria=Camisetas&nome_produto=Basica
            const products = await ProductModel.getAllProducts(filters);
            res.status(200).json(products);
        } catch (error) {
            console.error("Erro ao buscar produtos: ", error);
            res.status(500).json({ message: "Erro interno do servidor ao tentar buscar produtos." });
        }
    },

    async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await ProductModel.getProductById(id);
            if (!product) {
                return res.status(404).json({ message: "Produto não encontrado." });
            }
            res.status(200).json(product);
        } catch (error) {
            console.error("Erro ao buscar produto por ID: ", error);
            res.status(500).json({ message: "Erro interno do servidor ao tentar buscar produto." });
        }
    },

    async updateProduct(req, res) {
        try {
            // RN1: Apenas o lojista pode cadastrar, editar e excluir produtos (verificar com middleware)
            const { id } = req.params;
            const productData = req.body;

            const updated = await ProductModel.updateProduct(id, productData);
            if (!updated) {
                // Pode ser que o produto não exista, ou não houve alteração nos dados
                const productExists = await ProductModel.getProductById(id);
                if (!productExists) return res.status(404).json({ message: "Produto não encontrado para atualização." });
                return res.status(200).json({ message: "Nenhuma alteração detectada nos dados do produto." });
            }
            res.status(200).json({ message: "Produto atualizado com sucesso!" });
        } catch (error) {
            console.error("Erro ao atualizar produto: ", error);
            res.status(500).json({ message: "Erro interno do servidor ao tentar atualizar produto." });
        }
    },

    async deleteProduct(req, res) {
        try {
            // RN1: Apenas o lojista pode cadastrar, editar e excluir produtos (verificar com middleware)
            const { id } = req.params;
            const deleted = await ProductModel.deleteProduct(id);
            if (!deleted) {
                return res.status(404).json({ message: "Produto não encontrado para exclusão." });
            }
            res.status(200).json({ message: "Produto excluído com sucesso!" });
        } catch (error) {
            console.error("Erro ao excluir produto: ", error);
            if (error.message.includes("associado a um ou mais pedidos")) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: "Erro interno do servidor ao tentar excluir produto." });
        }
    }
};

module.exports = ProductController;

