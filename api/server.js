require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de CORS (Permitir acesso local e do domínio especificado)
app.use(
  cors({
    origin: ["https://maiconrg.github.io","http://127.0.0.1:5500" ], // Permitir acesso do domínio hospedado e local
    methods: ["GET", "POST"], // Métodos permitidos
  })
);

app.use(express.json()); // Parse JSON no corpo das requisições

// Configuração do Mongoose e Conexão com MongoDB
mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 segundos
    });
    console.log("Conectado ao MongoDB");
  } catch (err) {
    console.error("Erro ao conectar ao MongoDB:", err.message);
    process.exit(1); // Encerra o servidor em caso de falha na conexão
  }
};

// Definição do Schema e Model
const visitSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  ips: [{ type: String }], // Armazena uma lista de IPs únicos
});

const Visit = mongoose.model("Visit", visitSchema);

// Rota para verificar o status do servidor
app.get("/", (req, res) => {
  res.send("Servidor backend rodando!");
});

// Rota para registrar visitas e IPs
app.get("/contador", async (req, res) => {
  try {
    const ip = req.ip; // Captura o IP do cliente
    let visit = await Visit.findOne();

    if (!visit) {
      // Cria um novo documento se não existir
      visit = new Visit({ count: 1, ips: [ip] });
    } else {
      // Incrementa o contador e adiciona o IP se for único
      visit.count += 1;
      if (!visit.ips.includes(ip)) {
        visit.ips.push(ip);
      }
    }

    await visit.save(); // Salva as alterações no banco
    res.json({ count: visit.count, uniqueIPs: visit.ips.length });
  } catch (err) {
    console.error("Erro na rota /contador:", err.message);
    res.status(500).json({ error: "Erro interno no servidor", details: err.message });
  }
});

// Inicialização do Servidor
const startServer = async () => {
  await connectDB(); // Conecta ao banco de dados
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
};

startServer();
