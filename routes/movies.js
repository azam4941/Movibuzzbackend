const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const multer = require('multer');
const { authenticateToken, requireVerified } = require('../middleware/auth');

// Configure multer for memory storage (store in RAM, then convert to base64)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
    }
  }
});

// Helper function to convert buffer to base64 data URL
const bufferToBase64 = (buffer, mimetype) => {
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
};

// GET all movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single movie by ID
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }
    
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new movie (Verified users only)
router.post('/', authenticateToken, requireVerified, upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'gallery', maxCount: 5 } // Reduced to 5 for storage limits
]), async (req, res) => {
  try {
    const { title, year, description, downloadLink, streamingLink } = req.body;

    if (!title || !year || !description) {
      return res.status(400).json({ error: 'Title, year, and description are required' });
    }

    // Validate year
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 10) {
      return res.status(400).json({ error: 'Year must be a valid number between 1900 and ' + (new Date().getFullYear() + 10) });
    }

    // Convert uploaded images to base64
    const posterFile = req.files?.poster?.[0];
    const bannerFile = req.files?.banner?.[0];
    const galleryFiles = req.files?.gallery || [];

    if (!posterFile) {
      return res.status(400).json({ error: 'Poster image is required' });
    }

    const poster = bufferToBase64(posterFile.buffer, posterFile.mimetype);
    const banner = bannerFile 
      ? bufferToBase64(bannerFile.buffer, bannerFile.mimetype) 
      : poster; // Use poster as banner if no banner provided
    const gallery = galleryFiles.map(file => bufferToBase64(file.buffer, file.mimetype));

    const movie = new Movie({
      title: title.trim(),
      year: yearNum,
      description: description.trim(),
      poster,
      banner,
      downloadLink: (downloadLink || '').trim(),
      streamingLink: (streamingLink || '').trim(),
      gallery
    });

    await movie.save();
    res.status(201).json(movie);
  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(400).json({ error: error.message });
  }
});

// Multer error handler middleware
router.use((err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB per image.' });
    }
    if (err.message && err.message.includes('image')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  next();
});

// DELETE movie (Verified users only)
router.delete('/:id', authenticateToken, requireVerified, async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid movie ID format' });
    }
    
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
