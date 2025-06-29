import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

const visitSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  ips: [{ type: String }],
});

const Visit = mongoose.models.Visit || mongoose.model("Visit", visitSchema);

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  }
}

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "GET") {
    try {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      let visit = await Visit.findOne();

      if (!visit) {
        visit = new Visit({ count: 1, ips: [ip] });
      } else {
        visit.count += 1;
        if (!visit.ips.includes(ip)) {
          visit.ips.push(ip);
        }
      }

      await visit.save();
      res.status(200).json({ count: visit.count, uniqueIPs: visit.ips.length });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Erro interno no servidor", details: err.message });
    }
  } else {
    res.status(405).json({ error: "Método não permitido" });
  }
}
