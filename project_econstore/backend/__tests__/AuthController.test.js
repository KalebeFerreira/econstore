// project_econstore/backend/__tests__/AuthController.test.js

// Mockar os módulos necessários que AuthController depende.
// Isso impede que os testes interajam com o banco de dados real ou gerem tokens JWT reais,
// tornando-os rápidos e isolados.
jest.mock('../src/models/userModel'); // Mocka o modelo de usuário
jest.mock('bcryptjs'); // Mocka a biblioteca de hash de senha
jest.mock('jsonwebtoken'); // Mocka a biblioteca de tokens JWT

// Importar o controlador que vamos testar.
const AuthController = require('../src/controllers/authController');

// Importar os mocks do UserModel (para configurar o comportamento das suas funções)
const UserModel = require('../src/models/userModel');
// Importar os mocks do bcryptjs (para configurar o comportamento da função compare)
const bcrypt = require('bcryptjs');
// Importar os mocks do jsonwebtoken (para configurar o comportamento da função sign)
const jwt = require('jsonwebtoken');

// Mocks para simular os objetos de requisição (req) e resposta (res) do Express.
// Isso permite verificar o que o controlador tenta enviar como resposta.
const mockRequest = (body = {}, params = {}, query = {}, headers = {}) => ({
    body,
    params,
    query,
    headers,
    // Em testes que envolvem autenticação, 'req.user' pode ser populado por um middleware
    user: null // Começa como null, pode ser definido em testes específicos
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res); // Permite encadear .status().json()
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res); // Caso use .send()
    return res;
};

describe('AuthController', () => {
    let req;
    let res;

    beforeEach(() => {
        // Limpar todos os mocks antes de CADA teste.
        // Isso garante que cada teste comece com um estado limpo,
        // sem interferência de chamadas ou configurações de testes anteriores.
        jest.clearAllMocks();
        res = mockResponse(); // Criar um novo objeto de resposta para cada teste
    });

    // --- TESTES DE CADASTRO DE CLIENTE ---
    describe('register', () => {
        test('1. deve registrar um cliente com sucesso com dados válidos', async () => {
            // Cenário: O cliente preenche todos os dados corretamente para o cadastro (RF4, RN2).
            const userData = {
                nome_completo: 'Cliente Teste',
                cpf: '123.456.789-00',
                telefone: '61999998888',
                email: 'cliente@example.com',
                senha: 'SenhaSegura123!',
                tipo_usuario: 'cliente',
                endereco_rua: 'Rua A',
                endereco_numero: '10',
                endereco_complemento: 'Apto 1',
                endereco_bairro: 'Centro',
                endereco_cidade: 'Brasilia',
                endereco_estado: 'DF',
                endereco_cep: '70000-000'
            };

            // Mockar o UserModel.createUser para simular um cadastro bem-sucedido.
            // Ele deve retornar o id_usuario e o email do novo usuário.
            UserModel.createUser.mockResolvedValue({ id_usuario: 1, email: userData.email });

            // Configurar o objeto de requisição (req) com os dados do corpo.
            req = mockRequest(userData);

            // Chamar o método do controlador a ser testado.
            await AuthController.register(req, res);

            // Assegurar (expect) que o UserModel.createUser foi chamado UMA VEZ.
            expect(UserModel.createUser).toHaveBeenCalledTimes(1);
            // Assegurar que UserModel.createUser foi chamado com os dados corretos do usuário.
            expect(UserModel.createUser).toHaveBeenCalledWith(expect.objectContaining({
                nome_completo: userData.nome_completo,
                email: userData.email,
                // A senha deve ser passada para o modelo para ser hashed lá
                senha: userData.senha,
                tipo_usuario: 'cliente' // Verificar que o tipo padrão é cliente
            }));

            // Assegurar que a resposta HTTP foi 201 (Created).
            expect(res.status).toHaveBeenCalledWith(201);
            // Assegurar que a resposta JSON contém a mensagem de sucesso e o id do usuário.
            expect(res.json).toHaveBeenCalledWith({
                message: 'Usuário registrado com sucesso!',
                userId: 1
            });
        });

        // --- Testes de Cadastro com campos ausentes (Requisito: campos obrigatórios) ---
        test('1.1. deve retornar status 400 se nome_completo não for fornecido no cadastro', async () => {
            const userData = {
                cpf: '123.456.789-00', email: 'test@example.com', senha: 'password123',
                // Outros campos opcionais podem estar presentes
            };
            req = mockRequest(userData);
            await AuthController.register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Nome completo, CPF, e-mail e senha são obrigatórios." });
            expect(UserModel.createUser).not.toHaveBeenCalled(); // Garante que o modelo não foi chamado
        });

        test('1.2. deve retornar status 400 se CPF não for fornecido no cadastro', async () => {
            const userData = {
                nome_completo: 'Teste', email: 'test@example.com', senha: 'password123',
            };
            req = mockRequest(userData);
            await AuthController.register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Nome completo, CPF, e-mail e senha são obrigatórios." });
            expect(UserModel.createUser).not.toHaveBeenCalled();
        });

        test('1.3. deve retornar status 400 se email não for fornecido no cadastro', async () => {
            const userData = {
                nome_completo: 'Teste', cpf: '123.456.789-00', senha: 'password123',
            };
            req = mockRequest(userData);
            await AuthController.register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Nome completo, CPF, e-mail e senha são obrigatórios." });
            expect(UserModel.createUser).not.toHaveBeenCalled();
        });

        test('1.4. deve retornar status 400 se senha não for fornecida no cadastro', async () => {
            const userData = {
                nome_completo: 'Teste', cpf: '123.456.789-00', email: 'test@example.com',
            };
            req = mockRequest(userData);
            await AuthController.register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Nome completo, CPF, e-mail e senha são obrigatórios." });
            expect(UserModel.createUser).not.toHaveBeenCalled();
        });

        // Teste: Cadastro com e-mail já existente (RN06 - E-mail Único)
        test('1.5. deve retornar status 409 se o email já estiver cadastrado', async () => {
            const userData = {
                nome_completo: 'Cliente Existente',
                cpf: '000.000.000-00',
                email: 'existing@example.com',
                senha: 'SenhaExistente123!'
            };
            // Simular que UserModel.createUser lança um erro de e-mail duplicado
            UserModel.createUser.mockRejectedValue(new Error('E-mail já cadastrado.'));

            req = mockRequest(userData);
            await AuthController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: 'E-mail já cadastrado.' });
        });

        // Teste: Cadastro com CPF já existente (RN2 - Unicidade de CPF)
        test('1.6. deve retornar status 409 se o CPF já estiver cadastrado', async () => {
            const userData = {
                nome_completo: 'Cliente CPF Existente',
                cpf: '111.111.111-11',
                email: 'new_client@example.com',
                senha: 'SenhaNova123!'
            };
            // Simular que UserModel.createUser lança um erro de CPF duplicado
            UserModel.createUser.mockRejectedValue(new Error('CPF já cadastrado.'));

            req = mockRequest(userData);
            await AuthController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: 'CPF já cadastrado.' });
        });

        // Teste: Erro genérico do servidor durante o cadastro
        test('1.7. deve retornar status 500 em caso de erro interno do servidor', async () => {
            const userData = {
                nome_completo: 'Cliente Erro',
                cpf: '999.999.999-99',
                email: 'error@example.com',
                senha: 'SenhaErro123!'
            };
            // Simular que UserModel.createUser lança um erro genérico
            UserModel.createUser.mockRejectedValue(new Error('Erro inesperado no DB.'));

            req = mockRequest(userData);
            await AuthController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno do servidor ao tentar registrar usuário.' });
        });
    });


    // --- TESTES DE LOGIN DE CLIENTE ---
    describe('login', () => {
        // Cenário: Login de cliente sem preencher os campos (do checklist anterior)
        test('2.1. deve retornar status 400 se o email não for fornecido no login do cliente', async () => {
            req = mockRequest({ senha: 'password123' });
            await AuthController.login(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'E-mail e senha são obrigatórios.' });
        });

        test('2.2. deve retornar status 400 se a senha não for fornecida no login do cliente', async () => {
            req = mockRequest({ email: 'test@example.com' });
            await AuthController.login(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'E-mail e senha são obrigatórios.' });
        });

        test('2.3. deve retornar status 400 se nenhum campo for fornecido no login do cliente', async () => {
            req = mockRequest({});
            await AuthController.login(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'E-mail e senha são obrigatórios.' });
        });

        // Teste: Login de cliente com dados inválidos (do checklist)
        test('2.4. deve retornar status 401 para credenciais inválidas (usuário não encontrado)', async () => {
            // Mockar UserModel.findUserByEmail para retornar null (usuário não encontrado)
            UserModel.findUserByEmail.mockResolvedValue(null);

            req = mockRequest({ email: 'nonexistent@example.com', senha: 'anypassword' });
            await AuthController.login(req, res);

            expect(UserModel.findUserByEmail).toHaveBeenCalledTimes(1);
            expect(UserModel.findUserByEmail).toHaveBeenCalledWith('nonexistent@example.com');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Credenciais inválidas (usuário não encontrado).' });
            expect(bcrypt.compare).not.toHaveBeenCalled(); // A comparação de senha não deve ocorrer
        });

        test('2.5. deve retornar status 401 para credenciais inválidas (senha incorreta)', async () => {
            const mockUser = {
                id_usuario: 1,
                email: 'user@example.com',
                senha: 'hashedPassword', // Senha já hashed no DB
                tipo_usuario: 'cliente'
            };
            // Mockar UserModel.findUserByEmail para encontrar o usuário
            UserModel.findUserByEmail.mockResolvedValue(mockUser);
            // Mockar bcrypt.compare para retornar false (senha incorreta)
            bcrypt.compare.mockResolvedValue(false);

            req = mockRequest({ email: 'user@example.com', senha: 'wrongpassword' });
            await AuthController.login(req, res);

            expect(UserModel.findUserByEmail).toHaveBeenCalledTimes(1);
            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Credenciais inválidas (senha incorreta).' });
            expect(jwt.sign).not.toHaveBeenCalled(); // O token não deve ser gerado
        });

        // Teste: Login de cliente com dados válidos (do checklist)
        test('2.6. deve retornar status 200 e um token JWT para login válido', async () => {
            const mockUser = {
                id_usuario: 1,
                email: 'valid@example.com',
                senha: 'hashedPassword',
                nome_completo: 'User Valid',
                tipo_usuario: 'cliente'
            };
            const mockToken = 'mocked_jwt_token';

            UserModel.findUserByEmail.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue(mockToken); // Mockar a geração do token JWT

            // Mockar process.env.JWT_SECRET (normalmente estaria no seu setup de ambiente Jest)
            process.env.JWT_SECRET = 'supersecretkey';

            req = mockRequest({ email: 'valid@example.com', senha: 'correctpassword' });
            await AuthController.login(req, res);

            expect(UserModel.findUserByEmail).toHaveBeenCalledTimes(1);
            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(jwt.sign).toHaveBeenCalledTimes(1);
            // Verifica o payload do token
            expect(jwt.sign).toHaveBeenCalledWith(
                { id_usuario: 1, email: 'valid@example.com', tipo_usuario: 'cliente' },
                'supersecretkey', // Verifica se usa a chave secreta
                { expiresIn: '1h' }
            );

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login bem-sucedido!',
                token: mockToken,
                user: {
                    id_usuario: mockUser.id_usuario,
                    nome_completo: mockUser.nome_completo,
                    email: mockUser.email,
                    tipo_usuario: mockUser.tipo_usuario
                }
            });
        });

        // Teste: Erro interno do servidor durante o login
        test('2.7. deve retornar status 500 em caso de erro interno do servidor', async () => {
            // Simular um erro na busca do usuário
            UserModel.findUserByEmail.mockRejectedValue(new Error('Erro de conexão no DB.'));

            req = mockRequest({ email: 'any@example.com', senha: 'anypassword' });
            await AuthController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno do servidor ao tentar fazer login.' });
        });
    });
});