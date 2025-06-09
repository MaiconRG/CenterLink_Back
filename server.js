require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express(); // Certifique-se de que app é definido aqui.
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar ao MongoDB usando Mongoose
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado ao MongoDB com Mongoose"))
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB:", err.message);
  });

// Definir o esquema e o modelo
const visitSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
});

const Visit = mongoose.model("Visit", visitSchema);

// Rota para registrar e retornar o contador de visitas
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

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
