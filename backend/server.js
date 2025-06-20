require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const spotRoutes = require('./routes/spotRoutes');
const { cloudinary } = require('./config/cloudinary');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/spots', spotRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT} 🚀`);
    });
  })
  .catch((err) => console.error('MongoDB Error ❌', err));
