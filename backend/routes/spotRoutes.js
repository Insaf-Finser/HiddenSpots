const express = require('express');
const router = express.Router();
const Spot = require('../models/Spot');
const upload = require('../middleware/upload');

// POST with image upload and all required fields
router.post('/', upload.single('image'), async (req, res) => {
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

    const image = req.file?.path || imageUrlFromBody;

    // Only check required fields
    if (!title || !description || !latitude || !longitude || !type || !image) {
      return res.status(400).json({ error: 'All required fields: title, description, latitude, longitude, type, image.' });
    }

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
  } catch (error) {
    console.error('Create Spot Error:', error.message);
    res.status(500).json({ error: 'Failed to create spot' });
  }
});

// GET all spots
router.get('/', async (req, res) => {
  try {
    const spots = await Spot.find();
    res.json(spots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET spot by ID
router.get('/:id', async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    res.json(spot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/comment', async (req, res) => {
  const { text, user } = req.body;
  try {
    const spot = await Spot.findById(req.params.id);
    spot.comments.push({ text, user });
    await spot.save();
    res.json(spot.comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

//post rating
router.post('/:id/rating', async (req, res) => {
  const { userId, value } = req.body;
  if (!userId || typeof value !== 'number') {
    return res.status(400).json({ error: 'userId and value are required' });
  }
  try {
    const spot = await Spot.findById(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });

    // Find if user has already rated
    const existingRating = spot.ratings.find(r => r.userId === userId);
    if (existingRating) {
      existingRating.value = value;
    } else {
      spot.ratings.push({ userId, value });
    }

    // Recalculate averageRating and ratingCount
    spot.ratingCount = spot.ratings.length;
    spot.averageRating = spot.ratings.reduce((sum, r) => sum + r.value, 0) / (spot.ratingCount || 1);

    await spot.save();
    res.json({ averageRating: spot.averageRating, ratingCount: spot.ratingCount, userRating: value });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update rating' });
  }
});

//rating endpoint
router.get('/:id/rating', async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id).select('averageRating ratingCount ratings');
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    let userRating = null;
    if (req.query.userId) {
      const found = spot.ratings.find(r => r.userId === req.query.userId);
      userRating = found ? found.value : null;
    }
    res.json({ averageRating: spot.averageRating, ratingCount: spot.ratingCount, userRating });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});


router.post('/:id/gallery', async (req, res) => {
  const { imageUrl } = req.body;
  try {
    const spot = await Spot.findById(req.params.id);
    spot.gallery.push(imageUrl);
    await spot.save();
    res.json(spot.gallery);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add image' });
  }
});

// POST a new story with file upload and error handling
router.post('/:id/stories', upload.array('images', 10), async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const spot = await Spot.findById(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });

    const newStory = {
      title,
      content,
      author: author || 'Anonymous',
      images: req.files?.map(file => file.path) || []
    };

    spot.stories.push(newStory);
    await spot.save();
    
    res.status(201).json(spot);
  } catch (err) {
    console.error('Story creation error:', err);
    res.status(500).json({ error: 'Failed to create story', details: err.message });
  }
});

// GET stories for a spot
router.get('/:id/stories', async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id).select('stories');
    res.json(spot.stories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// PUT update a specific story with file upload and error handling
router.put('/:id/stories/:storyId', upload.array('images', 10), async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const spot = await Spot.findById(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });

    const story = spot.stories.id(req.params.storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    if (title) story.title = title;
    if (content) story.content = content;
    if (author) story.author = author;

    if (req.files?.length) {
      story.images = [...story.images, ...req.files.map(file => file.path)];
    }

    await spot.save();
    res.json(spot);
  } catch (err) {
    console.error('Story update error:', err);
    res.status(500).json({ error: 'Failed to update story', details: err.message });
  }
});

// PUT update spot (with image and gallery upload)
router.put('/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });

    // Only update required fields if provided
    if (req.body.title) spot.title = req.body.title;
    if (req.body.description) spot.description = req.body.description;
    if (req.body.type) spot.type = req.body.type;
    if (req.body.latitude) spot.latitude = parseFloat(req.body.latitude);
    if (req.body.longitude) spot.longitude = parseFloat(req.body.longitude);

    // Update main image (file or URL)
    if (req.files && req.files.image && req.files.image[0]) {
      spot.image = req.files.image[0].path;
    } else if (req.body.image && typeof req.body.image === 'string') {
      spot.image = req.body.image;
    }

    // Optional fields
    if (req.body.gallery) {
      let galleryArr = [];
      if (req.files && req.files.gallery) {
        galleryArr = req.files.gallery.map(file => file.path);
      }
      let urls = [];
      if (Array.isArray(req.body.gallery)) {
        urls = req.body.gallery;
      } else if (typeof req.body.gallery === 'string') {
        urls = [req.body.gallery];
      }
      galleryArr = galleryArr.concat(urls.filter(url => typeof url === 'string' && url.trim() !== ''));
      galleryArr = galleryArr.filter(Boolean);
      spot.gallery = galleryArr;
    }
    if (req.body.comments) spot.comments = req.body.comments;
    if (req.body.stories) spot.stories = req.body.stories;
    if (req.body.ratings) {
      spot.ratings = req.body.ratings;
      spot.ratingCount = spot.ratings.length;
      spot.averageRating = spot.ratingCount ? spot.ratings.reduce((sum, r) => sum + Number(r.value), 0) / spot.ratingCount : 0;
    }

    await spot.save();
    res.json(spot);
  } catch (error) {
    console.error('Update Spot Error:', error.message);
    res.status(500).json({ error: 'Failed to update spot' });
  }
});

module.exports = router;
