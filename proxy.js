export default async function handler(req, res) {
  try {
    // Forward request to your Apps Script
    const response = await fetch("https://script.google.com/macros/s/AKfycbyADAgCMvtppd5T_buahLW6TRflIVp6_H3jz6_u5qoynoIMyqQTneVGX55naG2yxdZgKg/exec", {
      method: req.method,
      headers: {
        "Content-Type": "application/json"
      },
      body: req.body
    });

    const data = await response.json();

    // Add CORS header so front-end can access it
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.status(200).json(data);

  } catch (error) {
    console.error(error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ success: false, message: "Proxy error" });
  }
}