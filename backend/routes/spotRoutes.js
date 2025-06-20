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
      rating
    } = req.body;

    const imageUrl = req.file?.path;

    if (!title || !description || !latitude || !longitude || !type || !rating || !imageUrl) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const newSpot = new Spot({
      title,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      type,
      rating: parseFloat(rating),
      image: imageUrl
    });

    await newSpot.save();
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
  const { rating } = req.body;
  try {
    const spot = await Spot.findById(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });

    // Update rating and rating count
    spot.ratingCount += 1;
    spot.rating = ((spot.rating * (spot.ratingCount - 1)) + parseFloat(rating)) / spot.ratingCount;

    await spot.save();
    res.json({ rating: spot.rating, ratingCount: spot.ratingCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update rating' });
  }
});

//rating endpoint
router.get('/:id/rating', async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id).select('rating ratingCount');
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    res.json({ rating: spot.rating, ratingCount: spot.ratingCount });
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

    // Update basic fields
    spot.title = req.body.title || spot.title;
    spot.description = req.body.description || spot.description;
    spot.type = req.body.type || spot.type;
    spot.latitude = req.body.latitude ? parseFloat(req.body.latitude) : spot.latitude;
    spot.longitude = req.body.longitude ? parseFloat(req.body.longitude) : spot.longitude;
    spot.rating = req.body.rating ? parseFloat(req.body.rating) : spot.rating;

    // Update main image
    if (req.files && req.files.image && req.files.image[0]) {
      spot.image = req.files.image[0].path;
    } else if (req.body.image && typeof req.body.image === 'string') {
      spot.image = req.body.image;
    }

    // Handle gallery: accept both URLs and uploaded files
    let galleryArr = [];

    // Add uploaded gallery images (files)
    if (req.files && req.files.gallery) {
      galleryArr = req.files.gallery.map(file => file.path);
    }

    // Add gallery URLs from body (can be string or array)
    if (req.body.gallery) {
      let urls = [];
      if (Array.isArray(req.body.gallery)) {
        urls = req.body.gallery;
      } else if (typeof req.body.gallery === 'string') {
        urls = [req.body.gallery];
      }
      galleryArr = galleryArr.concat(urls.filter(url => typeof url === 'string' && url.trim() !== ''));
    }

    // Remove empty strings (can happen if a field is left blank)
    galleryArr = galleryArr.filter(Boolean);

    // Replace gallery with new array (removes deleted images)
    spot.gallery = galleryArr;

    await spot.save();
    res.json(spot);
  } catch (error) {
    console.error('Update Spot Error:', error.message);
    res.status(500).json({ error: 'Failed to update spot' });
  }
  
  // Updated and more robust rating endpoint


});

 

module.exports = router;
