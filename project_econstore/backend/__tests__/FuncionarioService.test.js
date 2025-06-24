// project_econstore/backend/__tests__/FuncionarioService.test.js

// Mockar os módulos que funcionarioService depende.
jest.mock('../src/config/db'); // Mocka o banco de dados
jest.mock('bcrypt'); // Mocka a biblioteca bcrypt
jest.mock('jsonwebtoken'); // Mocka a biblioteca jsonwebtoken

// Importar o serviço a ser testado.
const FuncionarioService = require('../src/services/funcionarioService'); //
// Importar os mocks específicos.
const { getPool } = require('../src/config/db'); //
const bcrypt = require('bcrypt'); // Importa o mock de bcrypt
const jwt = require('jsonwebtoken'); // Importa o mock de jsonwebtoken

// --- DEFINIÇÕES DE MOCKS LOCAIS PARA O TESTE ---
const mockSelectResult = (rows = []) => [rows, undefined];

// mockPool e mockConnection devem ser definidos fora do beforeEach
// para que as mocks nos testes possam referenciá-los e limpá-los a cada teste.
const mockPool = {
    query: jest.fn(),
    getConnection: jest.fn(async () => ({
        query: jest.fn(),
        release: jest.fn(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
    })),
};

describe('FuncionarioService', () => {
    // Dados comuns para os lojistas mockados
    const commonEmail = 'lojista@econstore.com';
    const commonPassword = 'senhaLojista123';
    const commonHashedPassword = 'hashedPasswordLojista123'; // Senha simulada já hashed no DB
    const commonLojista = {
        id_usuario: 1,
        nome_completo: 'Lojista Teste',
        email: commonEmail,
        senha: commonHashedPassword,
        tipo_usuario: 'lojista',
        // Adicione 'nome' aqui se ele for usado no payload do JWT no serviço
        nome: 'Lojista Teste'
    };

    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todos os mocks antes de cada teste.

        // Configurar o comportamento padrão de getPool (retorna mockPool)
        getPool.mockResolvedValue(mockPool);

        // Resetar os mocks de query para CADA TESTE
        mockPool.query.mockClear();
        bcrypt.compare.mockClear();
        jwt.sign.mockClear();
    });

    describe('loginFuncionario', () => {
        test('1. deve retornar token e dados do lojista para login bem-sucedido', async () => {
            // Configurar mockPool.query para retornar o lojista
            mockPool.query.mockResolvedValueOnce(mockSelectResult([commonLojista]));
            // Configurar bcrypt.compare para simular que a senha está correta
            bcrypt.compare.mockResolvedValueOnce(true);
            // Configurar jwt.sign para retornar um token válido
            jwt.sign.mockReturnValue('mocked_jwt_token');

            // Chamar o serviço
            const result = await FuncionarioService.loginFuncionario(commonEmail, commonPassword);

            // Verificar se a query para buscar o lojista foi chamada
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledWith(
                'SELECT * FROM Usuarios WHERE email = ? AND tipo_usuario = "lojista"',
                [commonEmail]
            );

            // Verificar se bcrypt.compare foi chamado com os argumentos corretos
            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(bcrypt.compare).toHaveBeenCalledWith(commonPassword, commonHashedPassword);

            // Verificar se jwt.sign foi chamado para gerar o token
            expect(jwt.sign).toHaveBeenCalledTimes(1);
            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id_usuario: commonLojista.id_usuario,
                    email: commonLojista.email,
                    tipo_usuario: commonLojista.tipo_usuario,
                    nome: commonLojista.nome
                },
                process.env.JWT_SECRET, // process.env.JWT_SECRET é acessado pelo serviço
                { expiresIn: '1h' }
            );

            // Verificar o resultado retornado pelo serviço
            expect(result).toEqual({
                token: 'mocked_jwt_token',
                usuario: commonLojista
            });
        });

        test('2. deve retornar null se o lojista não for encontrado (email incorreto)', async () => {
            // Configurar mockPool.query para retornar nenhum lojista (array vazio)
            mockPool.query.mockResolvedValueOnce(mockSelectResult([]));

            const result = await FuncionarioService.loginFuncionario('emailnaoexiste@econstore.com', commonPassword);

            // Verifica se a query para buscar o lojista foi chamada
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledWith(
                'SELECT * FROM Usuarios WHERE email = ? AND tipo_usuario = "lojista"',
                ['emailnaoexiste@econstore.com']
            );

            // Nenhuma chamada para bcrypt.compare ou jwt.sign deve ocorrer, pois nenhum usuário foi encontrado
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();

            // O resultado deve ser null
            expect(result).toBeNull();
        });

        test('3. deve retornar null se a senha estiver incorreta', async () => {
            // Configurar mockPool.query para retornar o lojista
            mockPool.query.mockResolvedValueOnce(mockSelectResult([commonLojista]));
            // Configurar bcrypt.compare para simular que a senha está incorreta
            bcrypt.compare.mockResolvedValueOnce(false); // Retorna false para indicar senha incorreta

            // Chamar o serviço
            const result = await FuncionarioService.loginFuncionario(commonEmail, 'senhaIncorreta');

            // Verifica se a query para buscar o lojista foi chamada
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledWith(
                'SELECT * FROM Usuarios WHERE email = ? AND tipo_usuario = "lojista"',
                [commonEmail]
            );

            // Verifica se bcrypt.compare foi chamado
            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(bcrypt.compare).toHaveBeenCalledWith('senhaIncorreta', commonHashedPassword);

            // Nenhuma chamada para jwt.sign deve ocorrer
            expect(jwt.sign).not.toHaveBeenCalled();

            // O resultado deve ser null
            expect(result).toBeNull();
        });

        test('4. deve lançar erro se ocorrer uma falha no banco de dados', async () => {
            // Configurar mockPool.query para rejeitar (simulando erro de DB)
            const dbError = new Error('Erro de conexão com o banco de dados');
            mockPool.query.mockRejectedValueOnce(dbError);

            // Esperar que o serviço lance o erro
            await expect(FuncionarioService.loginFuncionario(commonEmail, commonPassword)).rejects.toThrow(dbError);

            // Verifica se a query para buscar o lojista foi chamada
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledWith(
                'SELECT * FROM Usuarios WHERE email = ? AND tipo_usuario = "lojista"',
                [commonEmail]
            );

            // Nenhuma chamada para bcrypt.compare ou jwt.sign deve ocorrer
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        test('5. deve lançar erro se ocorrer uma falha ao comparar senhas (erro bcrypt)', async () => {
            // Configurar mockPool.query para retornar o lojista
            mockPool.query.mockResolvedValueOnce(mockSelectResult([commonLojista]));
            // Configurar bcrypt.compare para rejeitar (simulando um erro interno do bcrypt)
            const bcryptError = new Error('Erro interno do bcrypt');
            bcrypt.compare.mockRejectedValueOnce(bcryptError);

            // Esperar que o serviço lance o erro
            await expect(FuncionarioService.loginFuncionario(commonEmail, commonPassword)).rejects.toThrow(bcryptError);

            // Verifica se a query para buscar o lojista foi chamada
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledWith(
                'SELECT * FROM Usuarios WHERE email = ? AND tipo_usuario = "lojista"',
                [commonEmail]
            );

            // Verifica se bcrypt.compare foi chamado
            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(bcrypt.compare).toHaveBeenCalledWith(commonPassword, commonHashedPassword);

            // Nenhuma chamada para jwt.sign deve ocorrer
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        test('6. deve lançar erro se ocorrer uma falha ao gerar o token JWT', async () => {
            // Configurar mockPool.query para retornar o lojista
            mockPool.query.mockResolvedValueOnce(mockSelectResult([commonLojista]));
            // Configurar bcrypt.compare para simular sucesso na comparação de senha
            bcrypt.compare.mockResolvedValueOnce(true);
            // Configurar jwt.sign para rejeitar (simulando falha na geração do token)
            const jwtError = new Error('Erro ao gerar token JWT');
            jwt.sign.mockImplementationOnce(() => { throw jwtError; });

            // Esperar que o serviço lance o erro
            await expect(FuncionarioService.loginFuncionario(commonEmail, commonPassword)).rejects.toThrow(jwtError);

            // Verifica as chamadas
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(jwt.sign).toHaveBeenCalledTimes(1); // jwt.sign deve ter sido chamado, mas falhou
        });
    });
});