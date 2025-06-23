// backend/__tests__/Produto.test.js

jest.mock('../src/config/db');

const { getPool, _mockConnection, _mockPool, _mockQueryResult } = require('../src/config/db');

// Esta é a ÚNICA DECLARAÇÃO de ProductModel que deve existir neste arquivo
const ProductModel = require('../src/models/productModel');

describe('ProductModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    test('deve criar um produto com sucesso e retornar seu ID e nome', async () => {
      _mockPool.query.mockResolvedValueOnce(_mockQueryResult([], 1, 101));

      const productData = {
        nome_produto: 'Novo Produto Teste',
        descricao: 'Descrição do produto teste',
        preco: 99.99,
        quantidade_estoque: 50,
        id_categoria: 1,
        imagem_url: 'http://example.com/imagem.jpg'
      };

      const result = await ProductModel.createProduct(productData);

      expect(getPool).toHaveBeenCalledTimes(1);
      expect(_mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO Produtos'),
        [
          productData.nome_produto,
          productData.descricao,
          productData.preco,
          productData.quantidade_estoque,
          productData.id_categoria,
          productData.imagem_url
        ]
      );
      expect(result).toEqual({ id_produto: 101, nome_produto: productData.nome_produto });
    });

    test('deve lançar um erro se a criação do produto falhar', async () => {
      const mockError = new Error('Erro de conexão com o banco de dados');
      _mockPool.query.mockRejectedValueOnce(mockError);

      const productData = { /* dados de qualquer produto */ };

      await expect(ProductModel.createProduct(productData)).rejects.toThrow(mockError);
    });
  });

  // ... (restante dos seus testes para getAllProducts, getProductById, etc.)

  describe('updateStock', () => {
    test('deve lançar erro de "Estoque insuficiente" se o estoque ficar negativo', async () => {
      _mockConnection.query.mockResolvedValueOnce(_mockQueryResult([], 0));
      _mockPool.getConnection.mockResolvedValueOnce(_mockConnection);

      const originalGetProductById = ProductModel.getProductById;
      ProductModel.getProductById = jest.fn().mockResolvedValueOnce({
        id_produto: 1,
        nome_produto: 'Produto Teste',
        quantidade_estoque: 2
      });

      const id_produto = 1;
      const quantityChange = -5;

      await expect(ProductModel.updateStock(id_produto, quantityChange)).rejects.toThrow(
        "Estoque insuficiente."
      );

      expect(ProductModel.getProductById).toHaveBeenCalledWith(id_produto);

      ProductModel.getProductById = originalGetProductById;
    });

    // ... outros testes de updateStock
  });
});