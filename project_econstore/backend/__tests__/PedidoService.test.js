// project_econstore/backend/__tests__/PedidoService.test.js

// Mockar os módulos que pedidoService depende.
jest.mock('../src/config/db'); // Mocka o banco de dados
jest.mock('../src/models/productModel'); // Mocka o modelo de produto

// Importar o serviço a ser testado.
const PedidoService = require('../src/services/pedidoService');
// Importar os mocks específicos de db.js para configurar o comportamento do pool e conexão.
const { getPool } = require('../src/config/db');
// Importar o mock do ProductModel para configurar seu comportamento.
const ProductModel = require('../src/models/productModel');

// --- DEFINIÇÕES DE MOCKS LOCAIS PARA O TESTE (similar ao que temos em outros testes) ---
const mockConnection = {
    query: jest.fn(),
    release: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
};

const mockPool = {
    getConnection: jest.fn(async () => mockConnection),
    query: jest.fn(),
};

const mockDMLResult = (insertId = null, affectedRows = 0) => [
    { insertId, affectedRows },
    undefined
];

const mockSelectResult = (rows = []) => [
    rows,
    undefined
];
// --- FIM DAS DEFINIÇÕES DE MOCKS LOCAIS ---


describe('PedidoService', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todos os mocks antes de cada teste.

        // Configurar o comportamento padrão do mock de getPool para retornar nosso mockPool.
        getPool.mockResolvedValue(mockPool);
        // Configurar mockPool.getConnection para retornar nossa mockConnection.
        mockPool.getConnection.mockResolvedValue(mockConnection);

        // Limpar mocks específicos da conexão para cada teste.
        mockConnection.query.mockClear();
        mockConnection.release.mockClear();
        mockConnection.beginTransaction.mockClear();
        mockConnection.commit.mockClear();
        mockConnection.rollback.mockClear();

        // Limpar mocks do ProductModel.
        ProductModel.getProductById.mockClear();
        ProductModel.updateStock.mockClear();
    });

    describe('criarPedido', () => {
        const commonProducts = [
            { id_produto: 1, quantidade: 2 },
            { id_produto: 2, quantidade: 1 }
        ];
        const commonTotal = 200.00;
        const commonStatus = 'Pendente';
        const commonUserId = 1;

        test('1. deve criar um pedido com sucesso, atualizar estoque e comitar a transação', async () => {
            // Cenário: Todos os produtos existem e há estoque suficiente.
            ProductModel.getProductById
                .mockResolvedValueOnce({ id_produto: 1, quantidade_estoque: 10, preco: 50.00 }) // Produto 1
                .mockResolvedValueOnce({ id_produto: 2, quantidade_estoque: 5, preco: 100.00 }); // Produto 2

            // Mockar a inserção do pedido principal.
            mockConnection.query.mockResolvedValueOnce(mockDMLResult(101, 1)); // id_pedido = 101

            // Mockar as atualizações de estoque (uma por produto).
            ProductModel.updateStock
                .mockResolvedValueOnce(true) // Atualização para Produto 1
                .mockResolvedValueOnce(true); // Atualização para Produto 2

            // Mockar a inserção dos itens do pedido.
            mockConnection.query
                .mockResolvedValueOnce(mockDMLResult(null, 1)) // Inserção item 1
                .mockResolvedValueOnce(mockDMLResult(null, 1)); // Inserção item 2

            const result = await PedidoService.criarPedido(
                commonProducts,
                commonTotal,
                commonStatus,
                commonUserId
            );

            // Verificar se a transação foi iniciada e comitada.
            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).not.toHaveBeenCalled(); // Não deve haver rollback

            // Verificar se ProductModel.getProductById foi chamado para cada produto.
            expect(ProductModel.getProductById).toHaveBeenCalledTimes(2);
            expect(ProductModel.getProductById).toHaveBeenCalledWith(1);
            expect(ProductModel.getProductById).toHaveBeenCalledWith(2);

            // Verificar se o pedido principal foi inserido.
            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO Pedidos'),
                [commonTotal, commonStatus, commonUserId]
            );

            // Verificar se ProductModel.updateStock foi chamado para cada produto (com quantidade negativa).
            expect(ProductModel.updateStock).toHaveBeenCalledTimes(2);
            expect(ProductModel.updateStock).toHaveBeenCalledWith(1, -2, mockConnection);
            expect(ProductModel.updateStock).toHaveBeenCalledWith(2, -1, mockConnection);

            // Verificar se os itens do pedido foram inseridos.
            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO ItensPedido'),
                [101, 1, 2, 50.00] // id_pedido, id_produto, quantidade, preco_unitario
            );
            expect(mockConnection.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO ItensPedido'),
                [101, 2, 1, 100.00]
            );

            // Verificar o resultado retornado.
            expect(result).toEqual({ id_pedido: 101, status: commonStatus });
            expect(mockConnection.release).toHaveBeenCalledTimes(1); // Conexão deve ser liberada
        });

        test('2. deve lançar erro e fazer rollback se um produto não for encontrado', async () => {
            ProductModel.getProductById
                .mockResolvedValueOnce({ id_produto: 1, quantidade_estoque: 10, preco: 50.00 })
                .mockResolvedValueOnce(null); // Produto 2 não encontrado

            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                .rejects.toThrow('Produto com ID 2 não encontrado.');

            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateStock).not.toHaveBeenCalled(); // Nenhuma atualização de estoque
        });

        test('3. deve lançar erro e fazer rollback se houver estoque insuficiente', async () => {
            ProductModel.getProductById
                .mockResolvedValueOnce({ id_produto: 1, quantidade_estoque: 10, preco: 50.00 })
                .mockResolvedValueOnce({ id_produto: 2, quantidade_estoque: 0, preco: 100.00 }); // Estoque insuficiente

            ProductModel.updateStock.mockRejectedValueOnce(new Error('Estoque insuficiente.')); // updateStock já lança esse erro

            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                .rejects.toThrow('Estoque insuficiente para o produto com ID: 2. Transação cancelada.'); // Mensagem do service

            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateStock).toHaveBeenCalledTimes(1); // Foi chamado para o 1º produto
            expect(mockConnection.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Pedidos')); // Pedido principal não deve ser inserido
        });

        test('4. deve lançar erro e fazer rollback se a inserção do pedido principal falhar', async () => {
            ProductModel.getProductById
                .mockResolvedValueOnce({ id_produto: 1, quantidade_estoque: 10, preco: 50.00 })
                .mockResolvedValueOnce({ id_produto: 2, quantidade_estoque: 5, preco: 100.00 });

            mockConnection.query.mockRejectedValueOnce(new Error('Falha na inserção do pedido.')); // Falha na 1ª query (inserção do pedido)

            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                .rejects.toThrow('Falha na inserção do pedido.');

            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateStock).not.toHaveBeenCalled(); // Nenhuma atualização de estoque deve ocorrer antes da falha
        });

        test('5. deve lançar erro e fazer rollback se a atualização de estoque falhar', async () => {
            ProductModel.getProductById
                .mockResolvedValueOnce({ id_produto: 1, quantidade_estoque: 10, preco: 50.00 })
                .mockResolvedValueOnce({ id_produto: 2, quantidade_estoque: 5, preco: 100.00 });

            mockConnection.query.mockResolvedValueOnce(mockDMLResult(101, 1)); // Inserção do pedido ok

            ProductModel.updateStock
                .mockResolvedValueOnce(true)
                .mockRejectedValueOnce(new Error('Erro ao atualizar estoque para produto 2.')); // Falha na atualização do segundo produto

            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                .rejects.toThrow('Erro ao atualizar estoque para produto 2. Transação cancelada.');

            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateStock).toHaveBeenCalledTimes(2); // Ambas as chamadas devem ter sido tentadas
            expect(mockConnection.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Pedidos')); // Pedido principal deve ter sido inserido
            expect(mockConnection.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO ItensPedido')); // Itens não devem ser inseridos
        });

        test('6. deve lançar erro e fazer rollback se a inserção de um item do pedido falhar', async () => {
            ProductModel.getProductById
                .mockResolvedValueOnce({ id_produto: 1, quantidade_estoque: 10, preco: 50.00 })
                .mockResolvedValueOnce({ id_produto: 2, quantidade_estoque: 5, preco: 100.00 });

            mockConnection.query.mockResolvedValueOnce(mockDMLResult(101, 1)); // Inserção do pedido ok

            ProductModel.updateStock
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true); // Atualizações de estoque ok

            mockConnection.query // A 1ª query é a inserção do pedido, a 2ª seria o 1º item do pedido
                .mockResolvedValueOnce(mockDMLResult(null, 1)) // Inserção pedido ok
                .mockRejectedValueOnce(new Error('Falha ao inserir item de pedido.')); // Falha na inserção do item

            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                .rejects.toThrow('Falha ao inserir item de pedido. Transação cancelada.');

            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateStock).toHaveBeenCalledTimes(2); // Atualizações de estoque devem ter sido feitas
            expect(mockConnection.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Pedidos')); // Pedido principal deve ter sido inserido
            expect(mockConnection.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO ItensPedido'), [101, 1, 2, 50.00]); // 1º item deve ter sido tentado
            expect(mockConnection.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO ItensPedido'), [101, 2, 1, 100.00]); // 2º item não deve ter sido tentado
        });
    });
});