// routes/geocode.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const response = await axios.get('https://us1.locationiq.com/v1/search.php', {
      params: {
        key: process.env.LOCATIONIQ_API_KEY,
        q: query,
        format: 'json',
        limit: 5
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Geocoding error:', err.response?.status, err.response?.data || err.message);
    res.status(500).json({
      error: 'Geocoding failed',
      message: err.response?.data || err.message,
      status: err.response?.status || 500
    });
  }
});


export default router;
