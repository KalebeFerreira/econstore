// project_econstore/backend/__tests__/PedidoService.test.js

// Mockar os módulos que pedidoService depende.
jest.mock('../src/config/db'); // Mocka o banco de dados
jest.mock('../src/models/productModel'); // Mocka o modelo de produto

// Importar o serviço a ser testado.
const PedidoService = require('../src/services/pedidoService'); //
// Importar os mocks específicos de db.js para configurar o comportamento do pool e conexão.
const { getPool } = require('../src/config/db'); //
// Importar o mock do ProductModel para configurar seu comportamento.
const ProductModel = require('../src/models/productModel'); //

// --- DEFINIÇÕES DE MOCKS LOCAIS PARA O TESTE ---
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
    // Usando 'id' em vez de 'id_produto' e adicionando 'preco' e 'nome_produto' para consistência
    const commonProducts = [
        { id: 1, quantidade: 2, preco: 50.00, nome_produto: 'Produto Teste 1', imagem: 'url_prod1.jpg' },
        { id: 2, quantidade: 1, preco: 100.00, nome_produto: 'Produto Teste 2', imagem: 'url_prod2.jpg' }
    ];
    const commonTotal = 200.00;
    const commonStatus = 'Pendente';
    const commonUserId = 1;


    beforeEach(() => {
        // Limpar todos os mocks antes de CADA teste para garantir isolamento.
        jest.clearAllMocks();

        // Configurar o comportamento padrão do mock de getPool e getConnection.
        getPool.mockResolvedValue(mockPool);
        mockPool.getConnection.mockResolvedValue(mockConnection);

        // Limpar mocks específicos da conexão e ProductModel para cada teste.
        mockConnection.query.mockClear();
        mockConnection.release.mockClear();
        mockConnection.beginTransaction.mockClear();
        mockConnection.commit.mockClear();
        mockConnection.rollback.mockClear();

        ProductModel.getProductById.mockClear();
        ProductModel.updateStock.mockClear();

        // Mock padrão para ProductModel.getProductById que retorna produtos existentes com estoque suficiente
        // Este mock será usado pela maioria dos testes, a menos que seja sobrescrito localmente.
        ProductModel.getProductById.mockImplementation(async (id) => {
            if (id === 1) {
                return { id_produto: 1, nome_produto: 'Produto Teste 1', quantidade_estoque: 10, preco: 50.00 };
            } else if (id === 2) {
                return { id_produto: 2, nome_produto: 'Produto Teste 2', quantidade_estoque: 5, preco: 100.00 };
            }
            return null; // Por padrão, se o ID não for 1 ou 2, retorna nulo.
        });

        // Mock padrão para ProductModel.updateStock para retornar sucesso
        // Isso evita que ele faça chamadas internas a `conn.query` e simplifica o teste.
        ProductModel.updateStock.mockResolvedValue(true);
    });

    describe('criarPedido', () => {

        test('1. deve criar um pedido com sucesso, atualizar estoque e comitar a transação', async () => {
            // Mocks para mockConnection.query na ordem exata das 3 chamadas que ocorrem
            mockConnection.query
                .mockResolvedValueOnce(mockDMLResult(101, 1)) // 1ª: INSERT INTO Pedidos
                .mockResolvedValueOnce(mockDMLResult(null, 1)) // 2ª: INSERT INTO ItensPedido item 1
                .mockResolvedValueOnce(mockDMLResult(null, 1)); // 3ª: INSERT INTO ItensPedido item 2


            const result = await PedidoService.criarPedido(
                commonProducts,
                commonTotal,
                commonStatus,
                commonUserId
            );

            // Asserções para sucesso
            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);

            expect(ProductModel.getProductById).toHaveBeenCalledTimes(2); // Chamadas iniciais para verificar estoque
            expect(ProductModel.getProductById).toHaveBeenCalledWith(1);
            expect(ProductModel.getProductById).toHaveBeenCalledWith(2);

            expect(mockConnection.query).toHaveBeenCalledTimes(3); // AGORA ESPERAMOS 3 CHAMADAS
            
            // Verificações explícitas das chamadas e seus argumentos
            expect(mockConnection.query.mock.calls[0][0]).toContain('INSERT INTO Pedidos');
            expect(mockConnection.query.mock.calls[0][1]).toEqual([commonUserId, commonTotal, commonStatus]);

            expect(ProductModel.updateStock).toHaveBeenCalledTimes(2); // ProductModel.updateStock é chamado 2 vezes
            expect(ProductModel.updateStock).toHaveBeenCalledWith(1, -2, mockConnection); // Com os argumentos corretos
            expect(ProductModel.updateStock).toHaveBeenCalledWith(2, -1, mockConnection); // Com os argumentos corretos

            expect(mockConnection.query.mock.calls[1][0]).toContain('INSERT INTO ItensPedido');
            expect(mockConnection.query.mock.calls[1][1]).toEqual([101, 1, 2, 50.00]);
            
            expect(mockConnection.query.mock.calls[2][0]).toContain('INSERT INTO ItensPedido');
            expect(mockConnection.query.mock.calls[2][1]).toEqual([101, 2, 1, 100.00]);


            expect(result).toEqual({ id_pedido: 101, status: commonStatus });
        });

        test('2. deve lançar erro e fazer rollback se um produto não for encontrado', async () => {
            // SOBRESCRITO: ProductModel.getProductById para simular produto não encontrado
            ProductModel.getProductById
                .mockResolvedValueOnce({ id_produto: 1, nome_produto: 'Produto Teste 1', quantidade_estoque: 10, preco: 50.00 })
                .mockResolvedValueOnce(null); // Produto 2 não encontrado

            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                .rejects.toThrow('Produto com ID 2 não encontrado. Transação cancelada.');

            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateStock).not.toHaveBeenCalled();
        });

        test('3. deve lançar erro e fazer rollback se houver estoque insuficiente', async () => {
            // SOBRESCRITO: ProductModel.getProductById para simular estoque 0 para o Produto 2
            ProductModel.getProductById
                .mockResolvedValueOnce({ id_produto: 1, nome_produto: 'Produto Teste 1', quantidade_estoque: 10, preco: 50.00 })
                .mockResolvedValueOnce({ id_produto: 2, nome_produto: 'Produto Teste 2', quantidade_estoque: 0, preco: 100.00 }); // Estoque insuficiente aqui

            // Não precisamos mockar mockConnection.query para as updates de estoque aqui,
            // pois o erro de estoque insuficiente é detectado ANTES de tentar atualizar o estoque
            // no PedidoService (no primeiro loop de verificação).

            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                // CORRIGIDO: Mensagem esperada para corresponder à que o serviço gera
                .rejects.toThrow('Estoque insuficiente para o produto "Produto Teste 2". Disponível: 0, solicitado: 1 Transação cancelada.');

            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateStock).not.toHaveBeenCalled(); // ProductModel.updateStock NÃO deve ser chamado pois o erro ocorre na verificação inicial
            expect(mockConnection.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO Pedidos')); // Pedido principal não deve ser inserido
            expect(mockConnection.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO ItensPedido')); // Itens não devem ser inseridos
        });


        test('4. deve lançar erro e fazer rollback se a inserção do pedido principal falhar', async () => {
            // ProductModel.getProductById já é mockado no beforeEach para retornar estoque suficiente.

            // Mockando a 1ª chamada de query para falhar (inserção do pedido)
            mockConnection.query.mockRejectedValueOnce(new Error('Falha na inserção do pedido.'));

            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                .rejects.toThrow('Falha na inserção do pedido. Transação cancelada.');

            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateStock).not.toHaveBeenCalled(); // Nenhuma atualização de estoque deve ocorrer antes da falha
        });

        test('5. deve lançar erro e fazer rollback se a atualização de estoque falhar', async () => {
            // ProductModel.getProductById já é mockado no beforeEach para retornar estoque suficiente.

            // SOBRESCRITO: ProductModel.updateStock para o produto 2 deve FALHAR
            ProductModel.updateStock.mockResolvedValueOnce(true) // Product 1 updates successfully
                                   .mockRejectedValueOnce(new Error('Erro ao atualizar estoque para produto 2.')); // Product 2 update fails

            // Mocks para mockConnection.query (agora apenas 2 chamadas, antes da falha de updateStock do produto 2)
            mockConnection.query
                .mockResolvedValueOnce(mockDMLResult(101, 1)) // 1ª: INSERT INTO Pedidos (sucesso)
                .mockResolvedValueOnce(mockDMLResult(null, 1)); // 2ª: INSERT INTO ItensPedido item 1 (sucesso)


            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                .rejects.toThrow('Erro ao atualizar estoque para produto 2. Transação cancelada.');

            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);
            expect(ProductModel.updateStock).toHaveBeenCalledTimes(2); // Ambas as chamadas devem ter sido tentadas
            expect(ProductModel.updateStock).toHaveBeenCalledWith(1, -2, mockConnection);
            expect(ProductModel.updateStock).toHaveBeenCalledWith(2, -1, mockConnection);
            expect(mockConnection.query).toHaveBeenCalledTimes(2); // APENAS 2 CHAMADAS DEVEM TER OCORRIDO AQUI
            
            // Verificações explícitas das chamadas e seus argumentos
            expect(mockConnection.query.mock.calls[0][0]).toContain('INSERT INTO Pedidos');
            expect(mockConnection.query.mock.calls[0][1]).toEqual([commonUserId, commonTotal, commonStatus]);

            expect(mockConnection.query.mock.calls[1][0]).toContain('INSERT INTO ItensPedido');
            expect(mockConnection.query.mock.calls[1][1]).toEqual([101, 1, 2, 50.00]);
        });

        test('6. deve lançar erro e fazer rollback se a inserção de um item do pedido falhar', async () => {
            // ProductModel.getProductById já é mockado no beforeEach para retornar estoque suficiente.

            // Mocks para mockConnection.query:
            // O erro deve ocorrer na 3ª chamada, que é a inserção do 2º item do pedido.
            mockConnection.query
                .mockResolvedValueOnce(mockDMLResult(101, 1)) // 1ª: INSERT INTO Pedidos
                .mockResolvedValueOnce(mockDMLResult(null, 1)) // 2ª: INSERT INTO ItensPedido item 1
                .mockRejectedValueOnce(new Error('Falha ao inserir item de pedido.')); // 3ª: INSERT INTO ItensPedido item 2 (FALHA INTENCIONAL)


            await expect(PedidoService.criarPedido(commonProducts, commonTotal, commonStatus, commonUserId))
                .rejects.toThrow('Falha ao inserir item de pedido. Transação cancelada.');

            // Asserções
            expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
            expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalledTimes(1);

            expect(ProductModel.getProductById).toHaveBeenCalledTimes(2);
            expect(ProductModel.getProductById).toHaveBeenCalledWith(1);
            expect(ProductModel.getProductById).toHaveBeenCalledWith(2);

            expect(ProductModel.updateStock).toHaveBeenCalledTimes(2);
            expect(ProductModel.updateStock).toHaveBeenCalledWith(1, -2, mockConnection);
            expect(ProductModel.updateStock).toHaveBeenCalledWith(2, -1, mockConnection);

            expect(mockConnection.query).toHaveBeenCalledTimes(3); // Deve haver 3 chamadas no total
            // Verificações explícitas das chamadas e seus argumentos
            expect(mockConnection.query.mock.calls[0][0]).toContain('INSERT INTO Pedidos');
            expect(mockConnection.query.mock.calls[0][1]).toEqual([commonUserId, commonTotal, commonStatus]);

            expect(mockConnection.query.mock.calls[1][0]).toContain('INSERT INTO ItensPedido');
            expect(mockConnection.query.mock.calls[1][1]).toEqual([101, 1, 2, 50.00]);
            // A 3ª chamada falha, então não esperamos asserções de sucesso para o 2º item aqui.
        });
    });
});