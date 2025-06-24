// project_econstore/backend/__tests__/AuthMiddleware.test.js

// Mockar jsonwebtoken, pois o middleware o utiliza.
jest.mock('jsonwebtoken');

// Importar o middleware a ser testado.
const authMiddleware = require('../src/middlewares/authMiddleware');
// Importar o mock do jsonwebtoken para configurar seu comportamento.
const jwt = require('jsonwebtoken');

// Mocks para simular os objetos de requisição (req), resposta (res) e next do Express.
const mockRequest = (headers = {}) => ({
    headers // Simula o cabeçalho 'authorization'
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn(); // Mock para a função next()

describe('authMiddleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todos os mocks (incluindo jwt e next)
        res = mockResponse(); // Cria um novo objeto de resposta
        next = mockNext; // Reinicia o mock de next
    });

    // --- Testes para authenticateToken ---
    describe('authenticateToken', () => {
        const secretKey = 'supersecretjwtkey'; // Usar a mesma chave do serviço
        const validToken = 'Bearer valid.jwt.token';
        const decodedPayload = { id_usuario: 1, email: 'test@example.com', tipo_usuario: 'cliente' };

        beforeAll(() => {
            // Definir JWT_SECRET para o ambiente de teste, se já não estiver no setup global do Jest
            process.env.JWT_SECRET = secretKey;
        });

        test('1. deve chamar next() e popular req.user para um token válido', async () => {
            // Cenário: Token JWT válido fornecido no cabeçalho.
            req = mockRequest({ authorization: validToken });

            // Mockar jwt.verify para simular um token válido.
            jwt.verify.mockImplementationOnce((token, secret, callback) => {
                callback(null, decodedPayload); // Simula token válido, chama callback com payload
            });

            authMiddleware.authenticateToken(req, res, next);

            // Verificar se jwt.verify foi chamado com o token correto e a chave secreta.
            expect(jwt.verify).toHaveBeenCalledTimes(1);
            expect(jwt.verify).toHaveBeenCalledWith(
                validToken.split(' ')[1], // Apenas o token, sem 'Bearer '
                secretKey,
                expect.any(Function) // Verifica que uma função de callback foi passada
            );

            // Verificar se req.user foi populado corretamente.
            expect(req.user).toEqual(decodedPayload);
            // Verificar se next() foi chamado, permitindo que a requisição prossiga.
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled(); // Nenhuma resposta de erro deve ser enviada
        });

        test('2. deve retornar status 401 se nenhum token for fornecido', () => {
            // Cenário: Cabeçalho Authorization ausente ou vazio.
            req = mockRequest(); // Sem cabeçalho Authorization

            authMiddleware.authenticateToken(req, res, next);

            // Verificar que jwt.verify NÃO foi chamado.
            expect(jwt.verify).not.toHaveBeenCalled();
            // Verificar se next() NÃO foi chamado.
            expect(next).not.toHaveBeenCalled();
            // Verificar se a resposta 401 foi enviada.
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado. Nenhum token fornecido.' });
        });

        test('3. deve retornar status 403 se o token for inválido ou expirado', () => {
            // Cenário: Token inválido ou com erro de verificação.
            req = mockRequest({ authorization: 'Bearer invalid.token.here' });
            const mockError = new Error('invalid token');

            // Mockar jwt.verify para simular um token inválido.
            jwt.verify.mockImplementationOnce((token, secret, callback) => {
                callback(mockError, null); // Simula token inválido, chama callback com erro
            });

            authMiddleware.authenticateToken(req, res, next);

            // Verificar se jwt.verify foi chamado.
            expect(jwt.verify).toHaveBeenCalledTimes(1);
            expect(jwt.verify).toHaveBeenCalledWith(
                'invalid.token.here',
                secretKey,
                expect.any(Function)
            );
            // Verificar se next() NÃO foi chamado.
            expect(next).not.toHaveBeenCalled();
            // Verificar se a resposta 403 foi enviada.
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido ou expirado.' });
        });
    });

    // --- Outros testes para AuthMiddleware (isAdmin) viriam aqui ---
});