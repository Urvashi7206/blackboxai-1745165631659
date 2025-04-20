const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Multer setup for file upload handling
const upload = multer({ dest: 'uploads/' });

// Placeholder for TinyPNG API key
const TINYPNG_API_KEY = 'YOUR_TINYPNG_API_KEY_HERE';

// Endpoint for compressing image using TinyPNG API
app.post('/api/compress/tinypng', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  try {
    const imagePath = path.resolve(req.file.path);
    const imageData = fs.readFileSync(imagePath);

    // Upload image to TinyPNG API
    const response = await axios.post('https://api.tinify.com/shrink', imageData, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      auth: {
        username: 'api',
        password: TINYPNG_API_KEY,
      },
      responseType: 'json',
    });

    if (response.data && response.data.output && response.data.output.url) {
      // Download compressed image from TinyPNG output URL
      const compressedImageResponse = await axios.get(response.data.output.url, {
        responseType: 'arraybuffer',
      });

      // Send compressed image back to client
      res.set('Content-Type', 'image/png');
      res.send(Buffer.from(compressedImageResponse.data, 'binary'));
    } else {
      res.status(500).json({ error: 'Failed to compress image' });
    }
  } catch (error) {
    console.error('TinyPNG compression error:', error.message);
    res.status(500).json({ error: 'Compression service error' });
  } finally {
    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to delete uploaded file:', err);
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Image compression API server running at http://localhost:${port}`);
});
