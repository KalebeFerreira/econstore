// project_econstore/backend/__tests__/ProductController.test.js

// Mockar o ProductModel, pois o controller o utiliza.
jest.mock('../src/models/productModel');

// Importar o controlador a ser testado.
const ProductController = require('../src/controllers/productController');
// Importar o mock do ProductModel para configurar seu comportamento.
const ProductModel = require('../src/models/productModel');

// Mocks para simular os objetos de requisição (req) e resposta (res) do Express.
const mockRequest = (body = {}, params = {}, query = {}, headers = {}) => ({
    body,
    params,
    query,
    headers,
    user: { id_usuario: 1, email: 'admin@econstore.com', tipo_usuario: 'lojista' } // Simula um usuário lojista autenticado
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('ProductController', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todos os mocks antes de cada teste.
        res = mockResponse(); // Cria um novo objeto de resposta para cada teste.
    });

    // --- Testes para ProductController.createProduct ---
    describe('createProduct', () => {
        test('1. deve criar um produto com sucesso e retornar status 201', async () => {
            // Cenário: Requisição válida para criar um produto.
            const productData = {
                nome_produto: 'Camisa Polo Azul',
                descricao: 'Polo de algodão premium',
                preco: 89.99,
                quantidade_estoque: 100,
                id_categoria: 1,
                imagem_url: 'http://example.com/polo_azul.jpg'
            };
            const newProductResult = { id_produto: 201, nome_produto: productData.nome_produto };

            // Mockar o ProductModel.createProduct para simular sucesso.
            ProductModel.createProduct.mockResolvedValueOnce(newProductResult);

            req = mockRequest(productData);

            await ProductController.createProduct(req, res);

            // Verificar se ProductModel.createProduct foi chamado com os dados corretos.
            expect(ProductModel.createProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.createProduct).toHaveBeenCalledWith(productData);

            // Verificar o status e o JSON da resposta.
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Produto criado com sucesso!',
                product: newProductResult
            });
        });

        test('2. deve retornar status 400 se faltarem campos obrigatórios', async () => {
            // Cenário: Requisição sem o nome do produto (campo obrigatório).
            const invalidProductData = {
                descricao: 'Descrição',
                preco: 50.00,
                quantidade_estoque: 10,
                imagem_url: 'url.jpg'
            };

            req = mockRequest(invalidProductData);

            await ProductController.createProduct(req, res);

            // Verificar que ProductModel.createProduct NÃO foi chamado.
            expect(ProductModel.createProduct).not.toHaveBeenCalled();

            // Verificar o status e o JSON da resposta de erro.
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Nome do produto, preço e quantidade em estoque são obrigatórios.'
            });
        });

        test('3. deve retornar status 500 em caso de erro interno do servidor', async () => {
            // Cenário: O ProductModel.createProduct lança um erro inesperado.
            const productData = {
                nome_produto: 'Produto Com Erro',
                preco: 10.00,
                quantidade_estoque: 5,
                imagem_url: 'url.jpg'
            };
            const mockError = new Error('Erro de DB inesperado');

            // Mockar o ProductModel.createProduct para rejeitar com um erro.
            ProductModel.createProduct.mockRejectedValueOnce(mockError);

            req = mockRequest(productData);

            await ProductController.createProduct(req, res);

            // Verificar que ProductModel.createProduct foi chamado.
            expect(ProductModel.createProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.createProduct).toHaveBeenCalledWith(productData);

            // Verificar o status e o JSON da resposta de erro.
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Erro interno do servidor ao tentar criar produto.'
            });
        });
    });

    // --- Testes para ProductController.getAllProducts ---
    describe('getAllProducts', () => {
        test('1. deve retornar todos os produtos com status 200', async () => {
            // Cenário: Requisição para listar todos os produtos sem filtros.
            const mockProducts = [
                { id_produto: 1, nome_produto: 'Product A' },
                { id_produto: 2, nome_produto: 'Product B' }
            ];

            // Mockar ProductModel.getAllProducts para simular o retorno de produtos.
            ProductModel.getAllProducts.mockResolvedValueOnce(mockProducts);

            req = mockRequest(); // Requisição sem body, params ou query.

            await ProductController.getAllProducts(req, res);

            // Verificar se ProductModel.getAllProducts foi chamado sem filtros.
            expect(ProductModel.getAllProducts).toHaveBeenCalledTimes(1);
            expect(ProductModel.getAllProducts).toHaveBeenCalledWith({}); // Espera ser chamado sem filtros

            // Verificar o status e o JSON da resposta.
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockProducts);
        });

        test('2. deve retornar status 500 em caso de erro interno ao buscar produtos', async () => {
            // Cenário: O ProductModel.getAllProducts lança um erro inesperado.
            const mockError = new Error('Erro de DB ao listar produtos');

            // Mockar ProductModel.getAllProducts para rejeitar com um erro.
            ProductModel.getAllProducts.mockRejectedValueOnce(mockError);

            req = mockRequest();

            await ProductController.getAllProducts(req, res);

            // Verificar se ProductModel.getAllProducts foi chamado.
            expect(ProductModel.getAllProducts).toHaveBeenCalledTimes(1);
            expect(ProductModel.getAllProducts).toHaveBeenCalledWith({});

            // Verificar o status e o JSON da resposta de erro.
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Erro interno do servidor ao tentar buscar produtos.'
            });
        });
    });
    // --- Outros testes para ProductController viriam aqui (getAllProducts, getProductById, etc.) ---
});