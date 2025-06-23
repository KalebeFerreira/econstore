const express = require("express");
const ProductController = require("../controllers/productController");
const { authenticateToken, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rota para criar um novo produto (apenas lojista/admin)
// POST /api/products
router.post("/", authenticateToken, isAdmin, ProductController.createProduct);

// Rota para buscar todos os produtos (público)
// GET /api/products
router.get("/", ProductController.getAllProducts);

// Rota para buscar um produto específico por ID (público)
// GET /api/products/:id
router.get("/:id", ProductController.getProductById);

// Rota para atualizar um produto (apenas lojista/admin)
// PUT /api/products/:id
router.put("/:id", authenticateToken, isAdmin, ProductController.updateProduct);

// Rota para deletar um produto (apenas lojista/admin)
// DELETE /api/products/:id
router.delete("/:id", authenticateToken, isAdmin, ProductController.deleteProduct);

module.exports = router;

