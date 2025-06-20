const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  timestamp: { type: Date, default: Date.now },
  images: [String],
}, { _id: true }); // Explicitly enable _id for stories

const spotSchema = new mongoose.Schema({
  title: String,
  description: String,
  latitude: Number,
  longitude: Number,
  type: String,
  image: String,
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  comments: [{
    text: String,
    user: String,
    timestamp: { type: Date, default: Date.now }
  }],
  gallery: [String],
  stories: [storySchema]
});

module.exports = mongoose.model('Spot', spotSchema);
