// project_econstore/backend/__tests__/PedidoController.test.js

// Mockar o PedidoService, pois o controller o utiliza.
jest.mock('../src/services/pedidoService'); //

// Importar o controlador a ser testado.
const PedidoController = require('../src/controllers/pedidoController'); //
// Importar o mock do PedidoService para configurar seu comportamento.
const PedidoService = require('../src/services/pedidoService'); //

// Mocks para simular os objetos de requisição (req) e resposta (res) do Express.
const mockRequest = (body = {}, params = {}, query = {}, headers = {}) => ({
    body,
    params,
    query,
    headers,
    user: null // Inicia como null, pode ser definido em testes específicos para simular autenticação
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('PedidoController', () => {
    let req;
    let res;

    // Dados comuns a serem usados nos testes
    const commonProducts = [{ id_produto: 1, quantidade: 2 }];
    const commonTotal = 100.00;
    const commonStatus = 'Aprovado';
    const commonUserId = 1; // ID de usuário para testes de sucesso de autenticação

    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todos os mocks antes de cada teste.
        res = mockResponse(); // Cria um novo objeto de resposta para cada teste.
    });

    // --- Testes para PedidoController.criarPedido ---
    describe('criarPedido', () => {
        test('1. deve criar um pedido com sucesso e retornar status 201', async () => {
            // Cenário: Requisição válida com todos os dados e id_usuario.
            const pedidoCriadoMock = { id_pedido: 101, status: commonStatus };
            PedidoService.criarPedido.mockResolvedValueOnce(pedidoCriadoMock);

            // id_usuario deve estar no body da requisição
            req = mockRequest({
                produtos: commonProducts,
                total: commonTotal,
                status: commonStatus,
                id_usuario: commonUserId
            });

            await PedidoController.criarPedido(req, res);

            // Verifica se o PedidoService.criarPedido foi chamado com os argumentos corretos.
            expect(PedidoService.criarPedido).toHaveBeenCalledTimes(1);
            expect(PedidoService.criarPedido).toHaveBeenCalledWith(
                commonProducts,
                commonTotal,
                commonStatus,
                commonUserId
            );

            // Verifica o status e o JSON da resposta de sucesso.
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(pedidoCriadoMock);
        });

        test('2. deve retornar status 500 em caso de erro no serviço de pedido', async () => {
            // Cenário: PedidoService lança um erro (ex: falha de DB, estoque insuficiente).
            const mockError = new Error('Erro simulado no serviço de pedido.');
            PedidoService.criarPedido.mockRejectedValueOnce(mockError);

            // id_usuario também precisa estar presente para este teste
            req = mockRequest({
                produtos: commonProducts,
                total: commonTotal,
                status: commonStatus,
                id_usuario: commonUserId
            });

            await PedidoController.criarPedido(req, res);

            // Verifica se o PedidoService foi chamado.
            expect(PedidoService.criarPedido).toHaveBeenCalledTimes(1);
            expect(PedidoService.criarPedido).toHaveBeenCalledWith(
                commonProducts,
                commonTotal,
                commonStatus,
                commonUserId
            );

            // Verifica o status e o JSON da resposta de erro do controller.
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao criar pedido',
                detalhes: mockError.message
            });
        });

        test('3. deve retornar status 500 se faltarem campos obrigatórios no body (produtos)', async () => {
            // Cenário: 'produtos' não é fornecido ou é inválido. O controller repassa, e o serviço falha.
            // Mockamos o serviço para REJEITAR, simulando a validação interna ou erro do DB.
            PedidoService.criarPedido.mockRejectedValueOnce(new Error('Campo "produtos" inválido.'));

            req = mockRequest({
                // produtos: missing
                total: commonTotal,
                status: commonStatus,
                id_usuario: commonUserId
            });

            await PedidoController.criarPedido(req, res);

            // O controller atual não valida esses campos e lança 500 se o serviço falhar.
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao criar pedido',
                detalhes: 'Campo "produtos" inválido.' // A mensagem de erro virá do serviço mockado
            });
            // O serviço DEVE ser chamado
            expect(PedidoService.criarPedido).toHaveBeenCalledTimes(1);
        });

        test('4. deve retornar status 500 se faltarem campos obrigatórios no body (total)', async () => {
            // Cenário: 'total' não é fornecido ou é inválido.
            // Mockamos o serviço para REJEITAR.
            PedidoService.criarPedido.mockRejectedValueOnce(new Error('Campo "total" inválido.'));

            req = mockRequest({
                produtos: commonProducts,
                // total: missing
                status: commonStatus,
                id_usuario: commonUserId
            });
            await PedidoController.criarPedido(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao criar pedido',
                detalhes: 'Campo "total" inválido.'
            });
            expect(PedidoService.criarPedido).toHaveBeenCalledTimes(1);
        });

        test('5. deve retornar status 500 se faltarem campos obrigatórios no body (status)', async () => {
            // Cenário: 'status' não é fornecido ou é inválido.
            // Mockamos o serviço para REJEITAR.
            PedidoService.criarPedido.mockRejectedValueOnce(new Error('Campo "status" inválido.'));

            req = mockRequest({
                produtos: commonProducts,
                total: commonTotal,
                // status: missing
                id_usuario: commonUserId
            });
            await PedidoController.criarPedido(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao criar pedido',
                detalhes: 'Campo "status" inválido.'
            });
            expect(PedidoService.criarPedido).toHaveBeenCalledTimes(1);
        });

        test('6. deve retornar status 500 se id_usuario não estiver presente (usuário não autenticado)', async () => {
            // Cenário: id_usuario não está no body. O controller passará undefined para o serviço.
            // Mockamos o serviço para REJEITAR, simulando a falha devido a id_usuario ausente/inválido.
            PedidoService.criarPedido.mockRejectedValueOnce(new Error('ID do usuário é obrigatório ou inválido.'));

            req = mockRequest({
                produtos: commonProducts,
                total: commonTotal,
                status: commonStatus,
                // id_usuario: missing
            });
            await PedidoController.criarPedido(req, res);

            // O controller atual não retorna 401 para isso; ele delega ao serviço e, se falhar, retorna 500.
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                erro: 'Erro ao criar pedido',
                detalhes: 'ID do usuário é obrigatório ou inválido.' // A mensagem de erro virá do serviço mockado
            });
            expect(PedidoService.criarPedido).toHaveBeenCalledTimes(1); // O serviço ainda é chamado
        });
    });
});