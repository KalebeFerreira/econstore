// project_econstore/backend/__tests__/VerPedidosService.test.js

// Mockar o módulo de configuração do banco de dados (db.js).
jest.mock('../src/config/db');

// Importar o serviço a ser testado.
const VerPedidosService = require('../src/services/verPedidosService');

// Importar os mocks específicos de db.js para configurar o comportamento do pool e conexão.
const { getPool } = require('../src/config/db');

// --- DEFINIÇÕES DE MOCKS LOCAIS PARA O DB (Copiadas de outros testes) ---
const mockConnection = {
    query: jest.fn(),
    release: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
};

const mockPool = {
    getConnection: jest.fn(async () => mockConnection),
    query: jest.fn(), // Para queries diretas no pool
};

const mockSelectResult = (rows = []) => [
    rows,
    undefined // Segundo elemento do array (fields)
];
// --- FIM DAS DEFINIÇÕES DE MOCKS LOCAIS ---


describe('VerPedidosService', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todos os mocks antes de cada teste.

        // Configurar o comportamento padrão do mock de getPool para retornar nosso mockPool.
        getPool.mockResolvedValue(mockPool);
        // Limpar mocks específicos do pool e conexão para cada teste.
        mockPool.query.mockClear();
        mockPool.getConnection.mockClear();
        mockConnection.query.mockClear();
        mockConnection.release.mockClear();
        mockConnection.beginTransaction.mockClear();
        mockConnection.commit.mockClear();
        mockConnection.rollback.mockClear();
    });

    describe('listarTodosPedidos', () => {
        // SQL query string para a consulta principal de Pedidos, COPIADA EXATAMENTE do serviço
        const SQL_PEDIDOS_REGEX = /SELECT\s+p\.id_pedido,\s+u\.nome_completo\s+AS\s+nome_completo,\s+p\.valor_total,\s+p\.status_pedido,\s+p\.data_pedido\s+FROM\s+Pedidos\s+p\s+JOIN\s+Usuarios\s+u\s+ON\s+p\.id_usuario\s+=\s+u\.id_usuario\s+ORDER\s+BY\s+p\.data_pedido\s+DESC/;

        // SQL query string para a consulta de ItensPedido, COPIADA EXATAMENTE do serviço
        const SQL_ITENS_PEDIDO_REGEX = /SELECT\s+ip\.quantidade,\s+pr\.nome_produto\s+FROM\s+itens_pedido\s+ip\s+JOIN\s+produtos\s+pr\s+ON\s+ip\.id_produto\s+=\s+pr\.id_produto\s+WHERE\s+ip\.id_pedido\s+=\s+\?/;


        test('1. deve retornar todos os pedidos com seus itens e dados do usuário', async () => {
            const mockPedidosDb = [
                { id_pedido: 1, valor_total: 100, status_pedido: 'Aprovado', id_usuario: 10, nome_completo: 'Cliente A', email: 'a@mail.com', data_pedido: new Date('2025-01-01') },
                { id_pedido: 2, valor_total: 150, status_pedido: 'Pendente', id_usuario: 11, nome_completo: 'Cliente B', email: 'b@mail.com', data_pedido: new Date('2025-01-02') },
            ];
            const mockItensPedidoDb1 = [
                { id_item_pedido: 1, id_pedido: 1, id_produto: 100, quantidade: 1, preco_unitario: 100, nome_produto: 'Produto X' },
            ];
            const mockItensPedidoDb2 = [
                { id_item_pedido: 2, id_pedido: 2, id_produto: 101, quantidade: 2, preco_unitario: 75, nome_produto: 'Produto Y' },
            ];

            // Mock para a PRIMEIRA consulta (busca de pedidos principais).
            mockPool.query.mockResolvedValueOnce(mockSelectResult(mockPedidosDb));
            // Mock para as CONSULTAS SUBSEQUENTES (busca de itens para CADA pedido).
            mockPool.query.mockResolvedValueOnce(mockSelectResult(mockItensPedidoDb1));
            mockPool.query.mockResolvedValueOnce(mockSelectResult(mockItensPedidoDb2));

            const result = await VerPedidosService.listarTodosPedidos();

            expect(mockPool.query).toHaveBeenCalledTimes(3);
            // CORRIGIDO: Usando expect.stringMatching com REGEX para a query de Pedidos
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringMatching(SQL_PEDIDOS_REGEX), []);
            // CORRIGIDO: Usando expect.stringMatching com REGEX para a query de ItensPedido
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringMatching(SQL_ITENS_PEDIDO_REGEX), [1]);
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringMatching(SQL_ITENS_PEDIDO_REGEX), [2]);

            expect(result).toEqual([
                {
                    id_pedido: 1,
                    valor_total: 100,
                    status_pedido: 'Aprovado',
                    id_usuario: 10,
                    nome_completo: 'Cliente A',
                    email: 'a@mail.com',
                    data_pedido: expect.any(Date),
                    itens: [{ id_item_pedido: 1, id_pedido: 1, id_produto: 100, quantidade: 1, preco_unitario: 100, nome_produto: 'Produto X' }]
                },
                {
                    id_pedido: 2,
                    valor_total: 150,
                    status_pedido: 'Pendente',
                    id_usuario: 11,
                    nome_completo: 'Cliente B',
                    email: 'b@mail.com',
                    data_pedido: expect.any(Date),
                    itens: [{ id_item_pedido: 2, id_pedido: 2, id_produto: 101, quantidade: 2, preco_unitario: 75, nome_produto: 'Produto Y' }]
                },
            ]);
        });

        test('2. deve retornar pedidos com lista vazia de itens se um pedido não tiver itens', async () => {
            const mockPedidosDb = [
                { id_pedido: 1, valor_total: 100, status_pedido: 'Aprovado', id_usuario: 10, nome_completo: 'Cliente A', email: 'a@mail.com', data_pedido: new Date('2025-01-01') },
                { id_pedido: 2, valor_total: 150, status_pedido: 'Pendente', id_usuario: 11, nome_completo: 'Cliente B', email: 'b@mail.com', data_pedido: new Date('2025-01-02') },
            ];

            mockPool.query.mockResolvedValueOnce(mockSelectResult(mockPedidosDb));
            mockPool.query.mockResolvedValue(mockSelectResult([]));

            const result = await VerPedidosService.listarTodosPedidos();

            expect(mockPool.query).toHaveBeenCalledTimes(3);
            expect(result).toEqual([
                {
                    id_pedido: 1,
                    valor_total: 100,
                    status_pedido: 'Aprovado',
                    id_usuario: 10,
                    nome_completo: 'Cliente A',
                    email: 'a@mail.com',
                    data_pedido: expect.any(Date),
                    itens: []
                },
                {
                    id_pedido: 2,
                    valor_total: 150,
                    status_pedido: 'Pendente',
                    id_usuario: 11,
                    nome_completo: 'Cliente B',
                    email: 'b@mail.com',
                    data_pedido: expect.any(Date),
                    itens: []
                },
            ]);
        });

        test('3. deve retornar um array vazio se nenhum pedido for encontrado', async () => {
            const mockPedidosDb = [];
            mockPool.query.mockResolvedValueOnce(mockSelectResult(mockPedidosDb));
            const result = await VerPedidosService.listarTodosPedidos();
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
        });

        test('4. deve lançar um erro em caso de falha genérica do banco de dados na busca de pedidos', async () => {
            const mockError = new Error('Falha de conexão ao buscar pedidos');
            mockPool.query.mockRejectedValueOnce(mockError);
            await expect(VerPedidosService.listarTodosPedidos()).rejects.toThrow(mockError);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });
    });
});