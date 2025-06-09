require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do middleware de CORS
app.use(
  cors({
    origin: "https://maiconrg.github.io", // Permita somente seu front-end
    methods: ["GET"], // Permita apenas requisições GET
    credentials: true, // Configure se houver cookies ou autenticação
  })
);

app.use(express.json());

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado ao MongoDB com Mongoose"))
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err.message);
  });

// Modelo do contador
const visitSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
});

const Visit = mongoose.model("Visit", visitSchema);

// Rotas
app.get("/", (req, res) => {
  res.send("Servidor backend rodando!");
});

app.get("/contador", async (req, res) => {
  try {
    let visit = await Visit.findOne();

    if (!visit) {
      visit = new Visit({ count: 1 });
    } else {
      visit.count += 1;
    }

    await visit.save();
    res.json({ count: visit.count });
  } catch (err) {
    console.error("Erro na rota /contador:", err.message);
    res.status(500).json({ error: "Erro interno no servidor", details: err.message });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
