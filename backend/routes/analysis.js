const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');

router.post('/save', async (req, res) => {
  try {
    const { userId, filename, category } = req.body;
    const analysis = new Analysis({ userId, filename, category });
    await analysis.save();
    res.json({ success: true, analysisId: analysis._id.toString() });
  } catch (error) {
    console.error('Analysis save error:', error);
    res.status(500).json({ success: false, error: 'Analysis save failed' });
  }
});

module.exports = router;