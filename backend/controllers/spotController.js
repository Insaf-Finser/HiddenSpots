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
      image: imageUrlFromBody,
      gallery = [],
      comments = [],
      stories = [],
      ratings = []
    } = req.body;

    // Accept image from file upload or URL
    const image = req.file?.path || imageUrlFromBody;

    // Only check required fields
    if (!title || !description || !latitude || !longitude || !type || !image) {
      return res.status(400).json({ error: 'All required fields: title, description, latitude, longitude, type, image.' });
    }

    // Calculate averageRating and ratingCount from ratings array
    const ratingCount = ratings.length;
    const averageRating = ratingCount ? ratings.reduce((sum, r) => sum + Number(r.value), 0) / ratingCount : 0;

    const newSpot = await Spot.create({
      title,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      type,
      image,
      gallery,
      comments,
      stories,
      ratings,
      averageRating,
      ratingCount
    });

    res.status(201).json(newSpot);
  } catch (err) {
    console.error('Create Spot Error:', err.message);
    res.status(500).json({ error: 'Failed to create spot' });
  }
};
