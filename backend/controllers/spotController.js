const Spot = require('../models/Spot');

exports.getSpots = async (req, res) => {
  try {
    const spots = await Spot.find();
    res.json(spots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
};

exports.createSpot = async (req, res) => {
  try {
    const {
      title,
      description,
      latitude,
      longitude,
      type,
      rating,
    } = req.body;

    const image = req.file?.path;

    // Basic input validation
    if (!title || !description || !latitude || !longitude || !type || !rating || !image) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const newSpot = await Spot.create({
      title,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      type,
      rating: parseFloat(rating),
      image
    });

    res.status(201).json(newSpot);
  } catch (err) {
    console.error('Create Spot Error:', err.message);
    res.status(500).json({ error: 'Failed to create spot' });
  }
};
