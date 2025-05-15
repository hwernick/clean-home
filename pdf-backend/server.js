const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

app.post('/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    fs.unlinkSync(req.file.path); // Clean up uploaded file
    res.json({ text: data.text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to extract PDF text.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));