const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.post("/api/save-note", (req, res) => {
  const { image, username } = req.body;

  if (!image) {
    return res
      .status(400)
      .json({ success: false, message: "Data gambar tidak ditemukan!" });
  }

  // Sanitasi nama file agar aman dari karakter khusus
  const safeName =
    username && username.trim() !== ""
      ? username.trim().replace(/[^a-zA-Z0-9_-]/g, "_")
      : "note";

  const base64Data = image.replace(/^data:image\/png;base64,/, "");
  const fileName = `${safeName}_${Date.now()}.png`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFile(filePath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Gagal menyimpan gambar:", err);
      return res
        .status(500)
        .json({ success: false, message: "Gagal menyimpan gambar ke server." });
    }
    res.json({
      success: true,
      message: "Sticky note berhasil disimpan!",
      filename: fileName,
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
