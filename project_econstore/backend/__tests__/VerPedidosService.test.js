// __tests__/VerPedidosService.test.js

// Mockar o módulo de configuração do banco de dados (db.js).
jest.mock('../src/config/db');

// Importar o serviço a ser testado.
const verPedidosService = require('../src/services/verPedidosService');

// Importar a função mockada getPool do módulo db.js.
const { getPool } = require('../src/config/db');

// --- DEFINIÇÕES DE MOCKS LOCAIS PARA O TESTE ---
const mockSelectResult = (rows = []) => [rows, undefined];

const mockPool = {
    query: jest.fn(),
    getConnection: jest.fn(async () => ({
        query: jest.fn(), // A conexão do pool também pode ter chamadas de query
        release: jest.fn(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
    })),
};
// --- FIM DAS DEFINIÇÕES DE MOCKS LOCAIS ---

// Definir as expressões regulares para as queries SQL fora do teste para reuso
// Usando \s+ para qualquer tipo de espaço em branco (incluindo newlines)
const SQL_PEDIDOS_REGEX = /SELECT\s+p.id_pedido,\s+u.nome_completo\s+AS\s+nome_completo,\s+p.valor_total,\s+p.status_pedido,\s+p.data_pedido\s+FROM\s+Pedidos\s+p\s+JOIN\s+Usuarios\s+u\s+ON\s+p.id_usuario\s+=\s+u.id_usuario\s+ORDER\s+BY\s+p.data_pedido\s+DESC/g;

const SQL_ITENS_PEDIDO_REGEX = /SELECT\s+ip.quantidade,\s+pr.nome_produto\s+FROM\s+itens_pedido\s+ip\s+JOIN\s+produtos\s+pr\s+ON\s+ip.id_produto\s+=\s+pr.id_produto\s+WHERE\s+ip.id_pedido\s+=\s+\?/g;


describe('VerPedidosService', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todos os mocks antes de cada teste.
        getPool.mockResolvedValue(mockPool); // Garante que getPool sempre retorne o mockPool
        mockPool.query.mockClear(); // Limpa as chamadas de query do pool para cada teste.
    });

    describe('listarTodosPedidos', () => {
        test('1. deve retornar todos os pedidos com seus itens e dados do usuário', async () => {
            // Mock dos resultados das queries:
            // 1ª query: busca os pedidos principais
            // 2ª query: busca os itens do primeiro pedido
            // 3ª query: busca os itens do segundo pedido
            mockPool.query
                .mockResolvedValueOnce(mockSelectResult([
                    { id_pedido: 1, id_usuario: 101, valor_total: 150.00, status_pedido: 'Aprovado', data_pedido: '2025-01-15T10:00:00Z', nome_completo: 'Cliente A' },
                    { id_pedido: 2, id_usuario: 102, valor_total: 200.00, status_pedido: 'Pendente', data_pedido: '2025-01-14T11:00:00Z', nome_completo: 'Cliente B' },
                ]))
                .mockResolvedValueOnce(mockSelectResult([
                    { quantidade: 1, nome_produto: 'Produto X' },
                    { quantidade: 2, nome_produto: 'Produto Y' },
                ]))
                .mockResolvedValueOnce(mockSelectResult([
                    { quantidade: 3, nome_produto: 'Produto Z' },
                ]));

            const pedidos = await verPedidosService.listarTodosPedidos();

            // Verifica o número total de chamadas ao mockPool.query
            expect(mockPool.query).toHaveBeenCalledTimes(3);

            // Verifica a primeira chamada (query de pedidos principais)
            expect(mockPool.query.mock.calls[0][0]).toMatch(SQL_PEDIDOS_REGEX);
            expect(mockPool.query.mock.calls[0][1]).toEqual(undefined); // CORRIGIDO: Espera undefined para parâmetros vazios

            // Verifica a segunda chamada (itens do primeiro pedido)
            expect(mockPool.query.mock.calls[1][0]).toMatch(SQL_ITENS_PEDIDO_REGEX);
            expect(mockPool.query.mock.calls[1][1]).toEqual([1]); // ID do pedido 1

            // Verifica a terceira chamada (itens do segundo pedido)
            expect(mockPool.query.mock.calls[2][0]).toMatch(SQL_ITENS_PEDIDO_REGEX);
            expect(mockPool.query.mock.calls[2][1]).toEqual([2]); // ID do pedido 2


            // Verifica o resultado final retornado pelo serviço
            expect(pedidos).toEqual([
                {
                    id_pedido: 1,
                    id_usuario: 101,
                    valor_total: 150.00,
                    status_pedido: 'Aprovado',
                    data_pedido: '2025-01-15T10:00:00Z',
                    nome_completo: 'Cliente A',
                    itens: [{ quantidade: 1, nome_produto: 'Produto X' }, { quantidade: 2, nome_produto: 'Produto Y' }],
                },
                {
                    id_pedido: 2,
                    id_usuario: 102,
                    valor_total: 200.00,
                    status_pedido: 'Pendente',
                    data_pedido: '2025-01-14T11:00:00Z',
                    nome_completo: 'Cliente B',
                    itens: [{ quantidade: 3, nome_produto: 'Produto Z' }],
                },
            ]);
        });

        test('2. deve retornar um array vazio se não houver pedidos', async () => {
            // Mock para a 1ª query (pedidos principais) retornar vazio
            mockPool.query.mockResolvedValueOnce(mockSelectResult([]));

            const pedidos = await verPedidosService.listarTodosPedidos();

            // Deve haver apenas 1 chamada para mockPool.query (para buscar pedidos)
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(mockPool.query.mock.calls[0][0]).toMatch(SQL_PEDIDOS_REGEX);
            expect(mockPool.query.mock.calls[0][1]).toEqual(undefined); // CORRIGIDO: Espera undefined para parâmetros vazios

            // O resultado deve ser um array vazio
            expect(pedidos).toEqual([]);
        });

        test('3. deve lançar um erro se a busca de pedidos principais falhar', async () => {
            // Mock para a 1ª query (pedidos principais) rejeitar
            const dbError = new Error('Erro de conexão com o banco de dados');
            mockPool.query.mockRejectedValueOnce(dbError);

            // Espera que o serviço lance o erro
            await expect(verPedidosService.listarTodosPedidos()).rejects.toThrow(dbError);

            // Apenas 1 chamada para mockPool.query (que falhou)
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(mockPool.query.mock.calls[0][0]).toMatch(SQL_PEDIDOS_REGEX);
            expect(mockPool.query.mock.calls[0][1]).toEqual(undefined); // CORRIGIDO: Espera undefined para parâmetros vazios
        });

        test('4. deve lançar um erro se a busca de itens de pedido falhar', async () => {
            // Mock para a 1ª query (pedidos principais) retornar sucesso
            mockPool.query.mockResolvedValueOnce(mockSelectResult([
                { id_pedido: 1, id_usuario: 101, valor_total: 150.00, status_pedido: 'Aprovado', data_pedido: '2025-01-15T10:00:00Z', nome_completo: 'Cliente A' },
            ]));
            // Mock para a 2ª query (itens do primeiro pedido) rejeitar
            const dbError = new Error('Erro ao buscar itens do pedido');
            mockPool.query.mockRejectedValueOnce(dbError);

            // Espera que o serviço lance o erro
            await expect(verPedidosService.listarTodosPedidos()).rejects.toThrow(dbError);

            // Verifica as chamadas
            expect(mockPool.query).toHaveBeenCalledTimes(2); // Pedidos principais + 1 tentativa de itens
            expect(mockPool.query.mock.calls[0][0]).toMatch(SQL_PEDIDOS_REGEX);
            expect(mockPool.query.mock.calls[0][1]).toEqual(undefined); // CORRIGIDO: Espera undefined para parâmetros vazios
            expect(mockPool.query.mock.calls[1][0]).toMatch(SQL_ITENS_PEDIDO_REGEX);
            expect(mockPool.query.mock.calls[1][1]).toEqual([1]);
        });

        test('5. deve retornar pedidos com itens vazios se nenhum item for encontrado', async () => {
            // Mock para a 1ª query (pedidos principais) retornar sucesso
            mockPool.query.mockResolvedValueOnce(mockSelectResult([
                { id_pedido: 1, id_usuario: 101, valor_total: 150.00, status_pedido: 'Aprovado', data_pedido: '2025-01-15T10:00:00Z', nome_completo: 'Cliente A' },
            ]));
            // Mock para a 2ª query (itens do primeiro pedido) retornar vazio
            mockPool.query.mockResolvedValueOnce(mockSelectResult([]));

            const pedidos = await verPedidosService.listarTodosPedidos();

            // Verifica as chamadas
            expect(mockPool.query).toHaveBeenCalledTimes(2);
            expect(mockPool.query.mock.calls[0][0]).toMatch(SQL_PEDIDOS_REGEX);
            expect(mockPool.query.mock.calls[0][1]).toEqual(undefined); // CORRIGIDO: Espera undefined para parâmetros vazios
            expect(mockPool.query.mock.calls[1][0]).toMatch(SQL_ITENS_PEDIDO_REGEX);
            expect(mockPool.query.mock.calls[1][1]).toEqual([1]);

            // Verifica o resultado
            expect(pedidos).toEqual([
                {
                    id_pedido: 1,
                    id_usuario: 101,
                    valor_total: 150.00,
                    status_pedido: 'Aprovado',
                    data_pedido: '2025-01-15T10:00:00Z',
                    nome_completo: 'Cliente A',
                    itens: [], // Itens vazios esperados
                },
            ]);
        });
    });
});