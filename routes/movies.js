const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireVerified } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

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
  { name: 'gallery', maxCount: 10 }
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

    const poster = req.files?.poster?.[0]?.filename 
      ? `/uploads/${req.files.poster[0].filename}` 
      : '';
    
    const banner = req.files?.banner?.[0]?.filename 
      ? `/uploads/${req.files.banner[0].filename}` 
      : poster; // Use poster as banner if no banner provided

    const gallery = req.files?.gallery 
      ? req.files.gallery.map(file => `/uploads/${file.filename}`)
      : [];

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
    // If there was an upload error, clean up uploaded files
    if (req.files) {
      const allFiles = [
        ...(req.files.poster || []),
        ...(req.files.banner || []),
        ...(req.files.gallery || [])
      ];
      allFiles.forEach(file => {
        const filePath = path.join(uploadsDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    res.status(400).json({ error: error.message });
  }
}, (err, req, res, next) => {
  // Multer error handler
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
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

    // Delete associated files
    const filesToDelete = [movie.poster, movie.banner, ...movie.gallery].filter(Boolean);
    filesToDelete.forEach(file => {
      if (file) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

