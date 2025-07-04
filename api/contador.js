import mongoose from "mongoose";
import fetch from "node-fetch"; // Certifique-se de instalar: npm install node-fetch

const MONGO_URI = process.env.MONGO_URI;

const visitSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  visits: [
    {
      ip: String,
      location: {
        country: String,
        region: String,
        city: String,
        lat: Number,
        lon: Number,
      },
    },
  ],
});

const Visit = mongoose.models.Visit || mongoose.model("Visit", visitSchema);

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  }
}

async function getLocation(ip) {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`
    );
    const data = await response.json();
    if (data.status === "success") {
      return {
        country: data.country,
        region: data.regionName,
        city: data.city,
        lat: data.lat,
        lon: data.lon,
      };
    }
  } catch (e) {
    // Ignora erros de localização
  }
  return {};
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  await connectDB();

  if (req.method === "GET") {
    try {
      const ip = (
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        ""
      )
        .split(",")[0]
        .trim();
      let visit = await Visit.findOne();

      if (!visit) {
        const location = await getLocation(ip);
        visit = new Visit({
          count: 1,
          visits: [{ ip, location }],
        });
      } else {
        visit.count += 1;
        if (!visit.visits.some((v) => v.ip === ip)) {
          const location = await getLocation(ip);
          visit.visits.push({ ip, location });
        }
      }

      await visit.save();
      res.status(200).json({
        count: visit.count,
        uniqueIPs: visit.visits.length,
        visits: visit.visits,
      });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Erro interno no servidor", details: err.message });
    }
  } else {
    res.status(405).json({ error: "Método não permitido" });
  }
}
