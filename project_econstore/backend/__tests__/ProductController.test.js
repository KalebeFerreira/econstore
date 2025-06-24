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

    // --- Testes para ProductController.getProductById ---
    describe('getProductById', () => {
        test('1. deve retornar um produto existente com status 200', async () => {
            // Cenário: Requisição para buscar um produto por ID que existe.
            const productId = 123;
            const mockProduct = {
                id_produto: productId,
                nome_produto: 'Laptop Pro',
                descricao: 'Um laptop potente',
                preco: 2500.00,
                quantidade_estoque: 5,
                id_categoria: 3,
                nome_categoria: 'Eletrônicos',
                imagem_url: 'url_laptop.jpg'
            };

            // Mockar ProductModel.getProductById para simular o retorno do produto.
            ProductModel.getProductById.mockResolvedValueOnce(mockProduct);

            req = mockRequest({}, { id: productId }); // O ID é passado nos params da requisição.

            await ProductController.getProductById(req, res);

            // Verificar se ProductModel.getProductById foi chamado com o ID correto.
            expect(ProductModel.getProductById).toHaveBeenCalledTimes(1);
            expect(ProductModel.getProductById).toHaveBeenCalledWith(productId);

            // Verificar o status e o JSON da resposta.
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockProduct);
        });

        test('2. deve retornar status 404 se o produto não for encontrado', async () => {
            // Cenário: Requisição para buscar um produto com um ID que não existe.
            const nonExistentProductId = 999;

            // Mockar ProductModel.getProductById para simular que o produto não foi encontrado.
            ProductModel.getProductById.mockResolvedValueOnce(null); // Retorna null se não encontrado

            req = mockRequest({}, { id: nonExistentProductId });

            await ProductController.getProductById(req, res);

            // Verificar se ProductModel.getProductById foi chamado.
            expect(ProductModel.getProductById).toHaveBeenCalledTimes(1);
            expect(ProductModel.getProductById).toHaveBeenCalledWith(nonExistentProductId);

            // Verificar o status e o JSON da resposta de erro 404.
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Produto não encontrado.'
            });
        });

        test('3. deve retornar status 500 em caso de erro interno ao buscar produto', async () => {
            // Cenário: O ProductModel.getProductById lança um erro inesperado.
            const productId = 1;
            const mockError = new Error('Erro de DB ao buscar produto por ID');

            // Mockar ProductModel.getProductById para rejeitar com um erro.
            ProductModel.getProductById.mockRejectedValueOnce(mockError);

            req = mockRequest({}, { id: productId });

            await ProductController.getProductById(req, res);

            // Verificar se ProductModel.getProductById foi chamado.
            expect(ProductModel.getProductById).toHaveBeenCalledTimes(1);
            expect(ProductModel.getProductById).toHaveBeenCalledWith(productId);

            // Verificar o status e o JSON da resposta de erro 500.
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Erro interno do servidor ao tentar buscar produto.'
            });
        });
    });

    // --- Testes para ProductController.updateProduct ---
    describe('updateProduct', () => {
        test('1. deve atualizar um produto existente com sucesso e retornar status 200', async () => {
            // Cenário: Requisição para atualizar um produto existente com dados válidos.
            const productId = 123;
            const updatedProductData = {
                nome_produto: 'Laptop Pro Max',
                descricao: 'Ainda mais potente',
                preco: 3000.00,
                quantidade_estoque: 7,
                id_categoria: 3,
                imagem_url: 'url_laptop_max.jpg'
            };

            // Mockar ProductModel.updateProduct para simular sucesso (retorna true).
            ProductModel.updateProduct.mockResolvedValueOnce(true);

            req = mockRequest(updatedProductData, { id: productId }); // ID no params, dados no body.

            await ProductController.updateProduct(req, res);

            // Verificar se ProductModel.updateProduct foi chamado com o ID e dados corretos.
            expect(ProductModel.updateProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateProduct).toHaveBeenCalledWith(productId, updatedProductData);

            // Verificar o status e o JSON da resposta de sucesso.
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Produto atualizado com sucesso!'
            });
        });

        test('2. deve retornar status 404 se o produto não for encontrado para atualização', async () => {
            // Cenário: Tentar atualizar um produto com um ID que não existe.
            const nonExistentProductId = 999;
            const productData = { nome_produto: 'Inexistente' }; // Apenas dados mínimos.

            // Mockar ProductModel.updateProduct para simular que o produto não foi encontrado (retorna false).
            // E ProductModel.getProductById para simular que o produto realmente não existe.
            ProductModel.updateProduct.mockResolvedValueOnce(false);
            ProductModel.getProductById.mockResolvedValueOnce(null); // O controller pode chamar isso para verificar existência.

            req = mockRequest(productData, { id: nonExistentProductId });

            await ProductController.updateProduct(req, res);

            // Verificar se ProductModel.updateProduct foi chamado.
            expect(ProductModel.updateProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateProduct).toHaveBeenCalledWith(nonExistentProductId, productData);
            // Verificar se getProductById foi chamado para confirmar a inexistência (se a lógica do controller o fizer).
            expect(ProductModel.getProductById).toHaveBeenCalledWith(nonExistentProductId);


            // Verificar o status e o JSON da resposta 404.
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Produto não encontrado para atualização.'
            });
        });

        test('3. deve retornar status 200 com mensagem "Nenhuma alteração detectada" se updateProduct retornar false mas o produto existir', async () => {
            // Cenário: O ProductModel.updateProduct retorna false (ex: nenhum campo mudou), mas o produto realmente existe.
            const productId = 123;
            const productData = { nome_produto: 'Laptop Pro', preco: 2500.00 }; // Dados iguais ou semelhantes.
            const mockProduct = { id_produto: productId, nome_produto: 'Laptop Pro', preco: 2500.00 }; // Simula o produto existente.

            // Mockar ProductModel.updateProduct para retornar false (nenhuma linha afetada ou sem mudanças).
            ProductModel.updateProduct.mockResolvedValueOnce(false);
            // Mockar ProductModel.getProductById para retornar o produto (confirmar que existe).
            ProductModel.getProductById.mockResolvedValueOnce(mockProduct);

            req = mockRequest(productData, { id: productId });

            await ProductController.updateProduct(req, res);

            // Verificar se ProductModel.updateProduct foi chamado.
            expect(ProductModel.updateProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateProduct).toHaveBeenCalledWith(productId, productData);
            // Verificar se getProductById foi chamado para confirmar a existência.
            expect(ProductModel.getProductById).toHaveBeenCalledWith(productId);

            // Verificar o status 200 e a mensagem de "nenhuma alteração".
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Nenhuma alteração detectada nos dados do produto." // <--- Para que corresponda ao controller
            });
        });


        test('4. deve retornar status 500 em caso de erro interno ao atualizar produto', async () => {
            // Cenário: O ProductModel.updateProduct lança um erro inesperado.
            const productId = 1;
            const productData = { nome_produto: 'Erro de Atualização' };
            const mockError = new Error('Falha de DB durante update');

            // Mockar ProductModel.updateProduct para rejeitar com um erro.
            ProductModel.updateProduct.mockRejectedValueOnce(mockError);

            req = mockRequest(productData, { id: productId });

            await ProductController.updateProduct(req, res);

            // Verificar se ProductModel.updateProduct foi chamado.
            expect(ProductModel.updateProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateProduct).toHaveBeenCalledWith(productId, productData);

            // Verificar o status e o JSON da resposta 500.
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Erro interno do servidor ao tentar atualizar produto.'
            });
        });
    });

    // --- Testes para ProductController.deleteProduct ---
    describe('deleteProduct', () => {
        test('1. deve deletar um produto com sucesso e retornar status 200', async () => {
            // Cenário: Requisição para deletar um produto existente.
            const productId = 123;

            // Mockar ProductModel.deleteProduct para simular sucesso (retorna true).
            ProductModel.deleteProduct.mockResolvedValueOnce(true);

            req = mockRequest({}, { id: productId }); // ID no params.

            await ProductController.deleteProduct(req, res);

            // Verificar se ProductModel.deleteProduct foi chamado com o ID correto.
            expect(ProductModel.deleteProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.deleteProduct).toHaveBeenCalledWith(productId);

            // Verificar o status e o JSON da resposta de sucesso.
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Produto excluído com sucesso!'
            });
        });

        test('2. deve retornar status 404 se o produto não for encontrado para exclusão', async () => {
            // Cenário: Tentar deletar um produto com um ID que não existe.
            const nonExistentProductId = 999;

            // Mockar ProductModel.deleteProduct para simular que o produto não foi encontrado (retorna false).
            ProductModel.deleteProduct.mockResolvedValueOnce(false);

            req = mockRequest({}, { id: nonExistentProductId });

            await ProductController.deleteProduct(req, res);

            // Verificar se ProductModel.deleteProduct foi chamado.
            expect(ProductModel.deleteProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.deleteProduct).toHaveBeenCalledWith(nonExistentProductId);

            // Verificar o status e o JSON da resposta 404.
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Produto não encontrado para exclusão.'
            });
        });

        test('3. deve retornar status 400 se o produto estiver associado a um pedido (restrição de FK)', async () => {
            // Cenário: Tentar deletar um produto que está associado a outro registro (ex: um pedido).
            const productId = 1;
            // Simula o erro que o ProductModel.deleteProduct lançaria por chave estrangeira.
            const mockFKError = new Error("Não é possível excluir o produto pois ele está associado a um ou mais pedidos.");

            ProductModel.deleteProduct.mockRejectedValueOnce(mockFKError);

            req = mockRequest({}, { id: productId });

            await ProductController.deleteProduct(req, res);

            // Verificar se ProductModel.deleteProduct foi chamado.
            expect(ProductModel.deleteProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.deleteProduct).toHaveBeenCalledWith(productId);

            // Verificar o status 400 e a mensagem de erro específica.
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Não é possível excluir o produto pois ele está associado a um ou mais pedidos."
            });
        });


        test('4. deve retornar status 500 em caso de erro interno ao deletar produto', async () => {
            // Cenário: O ProductModel.deleteProduct lança um erro inesperado genérico.
            const productId = 1;
            const mockError = new Error('Falha de DB durante delete genérico');

            // Mockar ProductModel.deleteProduct para rejeitar com um erro.
            ProductModel.deleteProduct.mockRejectedValueOnce(mockError);

            req = mockRequest({}, { id: productId });

            await ProductController.deleteProduct(req, res);

            // Verificar se ProductModel.deleteProduct foi chamado.
            expect(ProductModel.deleteProduct).toHaveBeenCalledTimes(1);
            expect(ProductModel.deleteProduct).toHaveBeenCalledWith(productId);

            // Verificar o status e o JSON da resposta 500.
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Erro interno do servidor ao tentar excluir produto.'
            });
        });
    });
    // --- Outros testes para ProductController viriam aqui (getAllProducts, getProductById, etc.) ---
});