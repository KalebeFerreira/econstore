// project_econstore/backend/__tests__/UserModel.test.js

// Mockar o módulo de configuração do banco de dados (db.js).
jest.mock('../src/config/db');
// Mockar a biblioteca 'bcryptjs' para controlar o hashing da senha.
jest.mock('bcryptjs');

// Importar o UserModel para ser testado.
const UserModel = require('../src/models/userModel');

// Importar APENAS a função mockada getPool do módulo db.js.
const { getPool } = require('../src/config/db');
// Importar o mock de bcryptjs para configurar o comportamento da função hash.
const bcrypt = require('bcryptjs');


// --- DEFINIÇÕES DE MOCKS LOCAIS PARA O TESTE ---
// Estas são as instâncias mockadas do Connection, do Pool e as funções auxiliares
// que serão usadas e redefinidas para cada teste.
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

// Função auxiliar local para criar resultados de query de INSERT/UPDATE/DELETE.
// O mysql2/promise para DMLs (Data Manipulation Language) retorna um array
// onde o primeiro elemento é o ResultSetHeader (com insertId, affectedRows).
const mockDMLResult = (insertId = null, affectedRows = 0) => [
    { insertId, affectedRows }, // Este será o 'result' em `const [result] = ...`
    undefined // O segundo elemento do array que o driver retorna (geralmente metadados/fields)
];

// Função auxiliar local para criar resultados de query de SELECT (que retornam linhas).
// Esta mantém o formato [rows, fields] para SELECTs.
const mockSelectResult = (rows = []) => [
    rows,
    undefined // fields
];
// --- FIM DAS DEFINIÇÕES DE MOCKS LOCAIS ---


describe('UserModel', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todos os calls e comportamentos de mocks.

        // Configurar o comportamento padrão do mock de getPool.
        getPool.mockResolvedValue(mockPool);

        // Limpar os mocks de query e connection para cada teste individualmente.
        mockPool.query.mockClear();
        mockPool.getConnection.mockClear();
        mockConnection.query.mockClear();
        mockConnection.release.mockClear();
        mockConnection.beginTransaction.mockClear();
        mockConnection.commit.mockClear();
        mockConnection.rollback.mockClear();
    });

    describe('createUser', () => {
        test('1. deve criar um novo usuário com senha hashed e retornar seu ID e email', async () => {
            const userData = {
                nome_completo: 'Novo Usuário',
                cpf: '111.222.333-44',
                telefone: '987654321',
                email: 'novo@email.com',
                senha: 'senhaOriginal',
                tipo_usuario: 'cliente',
                endereco_rua: 'Rua de Teste',
                endereco_numero: '123',
                endereco_complemento: 'Apto 456',
                endereco_bairro: 'Bairro Teste',
                endereco_cidade: 'Cidade Teste',
                endereco_estado: 'TS',
                endereco_cep: '00000-000'
            };
            const hashedPassword = 'hashedPassword123'; // Senha que bcrypt simulará gerar

            // Mockar bcrypt.genSalt para retornar um salt
            bcrypt.genSalt.mockResolvedValue('mockedSalt');
            // Mockar bcrypt.hash para retornar a senha hashed
            bcrypt.hash.mockResolvedValue(hashedPassword);

            // Mockar o mockPool.query para simular a inserção no banco de dados.
            // Usamos mockDMLResult para que o 'result' desestruturado contenha 'insertId'.
            mockPool.query.mockResolvedValueOnce(mockDMLResult(1, 1)); // insertId = 1, affectedRows = 1

            const result = await UserModel.createUser(userData);

            // Verificar se o bcrypt.genSalt foi chamado
            expect(bcrypt.genSalt).toHaveBeenCalledTimes(1);
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10); // Verifique se o round é 10

            // Verificar se o bcrypt.hash foi chamado com a senha original e o salt
            expect(bcrypt.hash).toHaveBeenCalledTimes(1);
            expect(bcrypt.hash).toHaveBeenCalledWith(userData.senha, 'mockedSalt');

            // Verificar se o mockPool.query foi chamado para inserir o usuário
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO Usuarios'),
                [
                    userData.nome_completo,
                    userData.cpf,
                    userData.telefone,
                    userData.email,
                    hashedPassword, // Deve usar a senha hashed
                    userData.tipo_usuario,
                    userData.endereco_rua,
                    userData.endereco_numero,
                    userData.endereco_complemento,
                    userData.endereco_bairro,
                    userData.endereco_cidade,
                    userData.endereco_estado,
                    userData.endereco_cep
                ]
            );

            // Verificar o resultado retornado: agora result.id_usuario deve ser 1
            expect(result).toEqual({ id_usuario: 1, email: userData.email });
        });

        // Teste de erro: E-mail já cadastrado (RN06)
        test('1.2. deve lançar erro se o email já estiver cadastrado (ER_DUP_ENTRY)', async () => {
            const userData = {
                email: 'duplicate@email.com',
                senha: 'somePassword',
                cpf: '123.456.789-00'
            };
            const mockError = new Error('Duplicate entry for key \'email\'');
            mockError.code = 'ER_DUP_ENTRY';
            mockError.message = 'Duplicate entry \'duplicate@email.com\' for key \'email\''; // Simula a mensagem real do MySQL

            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed');
            mockPool.query.mockRejectedValueOnce(mockError); // Simula o erro do banco de dados

            await expect(UserModel.createUser(userData)).rejects.toThrow('E-mail já cadastrado.');
        });

        // Teste de erro: CPF já cadastrado (RN02)
        test('1.3. deve lançar erro se o CPF já estiver cadastrado (ER_DUP_ENTRY)', async () => {
            const userData = {
                email: 'new@email.com',
                senha: 'somePassword',
                cpf: '000.000.000-00'
            };
            const mockError = new Error('Duplicate entry for key \'cpf\'');
            mockError.code = 'ER_DUP_ENTRY';
            mockError.message = 'Duplicate entry \'000.000.000-00\' for key \'cpf\''; // Simula a mensagem real do MySQL

            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed');
            mockPool.query.mockRejectedValueOnce(mockError); // Simula o erro do banco de dados

            await expect(UserModel.createUser(userData)).rejects.toThrow('CPF já cadastrado.');
        });

        // Teste de erro: Outro erro genérico do banco de dados
        test('1.4. deve lançar erro em caso de falha genérica do banco de dados', async () => {
            const userData = {
                email: 'fail@email.com',
                senha: 'somePassword',
                cpf: '111.111.111-11'
            };
            const mockError = new Error('Erro de conexão com o DB');
            mockError.code = 'SOME_OTHER_ERROR';

            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed');
            mockPool.query.mockRejectedValueOnce(mockError);

            await expect(UserModel.createUser(userData)).rejects.toThrow(mockError);
        });
    });

    describe('findUserById', () => {
        test('1. deve retornar um usuário existente por ID', async () => {
            // Cenário: Buscar um usuário cujo ID existe no banco de dados.
            const mockUser = {
                id_usuario: 20,
                nome_completo: 'Usuário ID Existente',
                email: 'idexistente@email.com',
                tipo_usuario: 'cliente',
                cpf: '555.555.555-55',
                telefone: '912345678',
                endereco_rua: 'Rua B',
                endereco_numero: '45',
                endereco_complemento: '',
                endereco_bairro: 'Bairro Novo',
                endereco_cidade: 'Cidade Nova',
                endereco_estado: 'SP',
                endereco_cep: '11111-111',
                data_cadastro: '2025-01-01T10:00:00Z'
            };
            const userId = 20;

            // Configurar o mockPool.query para retornar o usuário mockado.
            mockPool.query.mockResolvedValueOnce(mockSelectResult([mockUser]));

            const user = await UserModel.findUserById(userId);

            // Verificar se getPool foi chamado.
            expect(getPool).toHaveBeenCalledTimes(1);
            // Verificar se a query SELECT foi chamada com o ID correto e as colunas esperadas.
            expect(mockPool.query).toHaveBeenCalledWith(
                `SELECT id_usuario, nome_completo, email, tipo_usuario, cpf, telefone, endereco_rua, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, data_cadastro FROM Usuarios WHERE id_usuario = ?`,
                [userId]
            );
            // Verificar se a função retornou o usuário esperado.
            expect(user).toEqual(mockUser);
        });

        test('2. deve retornar undefined se o usuário não for encontrado por ID', async () => {
            // Cenário: Buscar um usuário cujo ID não existe.
            const nonExistentUserId = 999;

            // Configurar o mockPool.query para retornar um array vazio (usuário não encontrado).
            mockPool.query.mockResolvedValueOnce(mockSelectResult([]));

            const user = await UserModel.findUserById(nonExistentUserId);

            // Verificar se getPool foi chamado.
            expect(getPool).toHaveBeenCalledTimes(1);
            // Verificar se a query SELECT foi chamada.
            expect(mockPool.query).toHaveBeenCalledWith(
                `SELECT id_usuario, nome_completo, email, tipo_usuario, cpf, telefone, endereco_rua, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, data_cadastro FROM Usuarios WHERE id_usuario = ?`,
                [nonExistentUserId]
            );
            // Verificar se a função retornou undefined.
            expect(user).toBeUndefined();
        });

        test('3. deve lançar um erro em caso de falha genérica do banco de dados', async () => {
            // Cenário: Ocorre um erro inesperado durante a consulta ao banco de dados.
            const userId = 1;
            const mockError = new Error('Falha grave na conexão do DB');

            // Configurar o mockPool.query para rejeitar com o erro mockado.
            mockPool.query.mockRejectedValueOnce(mockError);

            // Esperar que a função findUserById lance o erro mockado.
            await expect(UserModel.findUserById(userId)).rejects.toThrow(mockError);

            // Verificar se getPool foi chamado.
            expect(getPool).toHaveBeenCalledTimes(1);
            // Verificar se a query SELECT foi chamada.
            expect(mockPool.query).toHaveBeenCalledWith(
                `SELECT id_usuario, nome_completo, email, tipo_usuario, cpf, telefone, endereco_rua, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, data_cadastro FROM Usuarios WHERE id_usuario = ?`,
                [userId]
            );
        });
    });
    // --- Outros testes para UserModel viriam aqui (findUserByEmail, findUserById, etc.) ---
});