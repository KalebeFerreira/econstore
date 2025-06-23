const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        console.log("Nenhum token recebido");
        return res.status(401).json({ message: "Acesso negado. Nenhum token fornecido." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Token inválido ou expirado:", err.message);
            return res.status(403).json({ message: "Token inválido ou expirado." });
        }
        console.log("Token decodificado:", user);
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        console.log("Usuário não autenticado no isAdmin");
        return res.status(401).json({ message: "Usuário não autenticado." });
    }
    if (req.user.tipo_usuario !== "lojista") {
        console.log("Usuário não é lojista:", req.user.tipo_usuario);
        return res.status(403).json({ message: "Acesso negado. Requer privilégios de lojista." });
    }
    next();
};

module.exports = { authenticateToken, isAdmin };

