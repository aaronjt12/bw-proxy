const express = require('express');
const axios = require('axios');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Allowed origins for CORS (your frontend domains)
const allowedOrigins = [
  'http://localhost:5173',         // Local dev
  'https://bootwatcher.com',       // Production
  'https://www.bootwatcher.com',   // Production with www
];

// Proxy endpoint for /send-sms
app.all('/send-sms', async (req, res) => {
  const origin = req.headers.origin;

  // Set CORS headers
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight (OPTIONS) requests
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }

  // Forward the request to the backend
  try {
    const backendResponse = await axios({
      method: req.method,
      url: 'https://sms-backend.up.railway.app/send-sms',
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Send the backend response back to the frontend
    res.status(backendResponse.status).json(backendResponse.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Failed to reach backend';
    res.status(status).json({ error: message });
  }
});

// Health check endpoint (for Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Proxy is healthy' });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});