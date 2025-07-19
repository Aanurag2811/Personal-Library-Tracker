const express = require('express');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const { uploadSingle, optimizeImage, handleUploadError, deleteUploadedFile } = require('../middleware/upload');
const axios = require('axios');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const bookValidationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  author: Joi.string().trim().min(1).max(100).required(),
  genre: Joi.string().trim().max(50).allow(''),
  status: Joi.string().valid('To Read', 'Reading', 'Read').default('To Read'),
  description: Joi.string().trim().max(2000).allow(''),
  isbn: Joi.string().trim().pattern(/^[0-9-]{10,17}$/).allow(''),
  publishedDate: Joi.string().trim().allow(''),
  pageCount: Joi.number().integer().min(1).max(50000).allow(null),
  rating: Joi.number().integer().min(1).max(5).allow(null),
  notes: Joi.string().trim().max(1000).allow(''),
  tags: Joi.array().items(Joi.string().trim().max(30)).max(10)
});

// @route   POST /api/books
// @desc    Add a book
// @access  Private
router.post('/', auth, uploadSingle, optimizeImage, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = bookValidationSchema.validate(req.body, { 
      allowUnknown: true,
      stripUnknown: true 
    });
    
    if (error) {
      // Delete uploaded file if validation fails
      if (req.file) {
        deleteUploadedFile(req.file.filename);
      }
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

    const book = new Book({
      ...value,
      coverImage,
      user: req.user._id
    });

    await book.save();
    res.status(201).json({
      message: 'Book added successfully',
      book
    });
  } catch (error) {
    console.error('Error adding book:', error);
    
    // Delete uploaded file if database save fails
    if (req.file) {
      deleteUploadedFile(req.file.filename);
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        details: errors 
      });
    }
    
    res.status(500).json({ message: 'Server error while adding book' });
  }
});

// @route   GET /api/books/search-external
// @desc    Search books via Google Books API
// @access  Public
router.get('/search-external', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    if (!process.env.GOOGLE_BOOKS_API_KEY) {
      return res.status(500).json({ message: 'Google Books API not configured' });
    }

    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${process.env.GOOGLE_BOOKS_API_KEY}`);
    
    if (!response.data.items) {
      return res.json({ books: [] });
    }
    
    const books = response.data.items.map(item => {
      const book = item.volumeInfo;
      return {
        title: book.title || 'Unknown Title',
        author: book.authors ? book.authors.join(', ') : 'Unknown Author',
        genre: book.categories ? book.categories[0] : '',
        description: book.description || '',
        isbn: book.industryIdentifiers ? book.industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier || book.industryIdentifiers[0]?.identifier : '',
        publishedDate: book.publishedDate || '',
        pageCount: book.pageCount || null,
        coverImage: book.imageLinks ? book.imageLinks.thumbnail || book.imageLinks.smallThumbnail : null,
        language: book.language || 'en'
      };
    });

    res.json({ books });
  } catch (error) {
    console.error('Google Books API error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error searching external book database' });
  }
});

// @route   GET /api/books/search
// @desc    Search user's books
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const searchRegex = new RegExp(query, 'i');
    
    const books = await Book.find({
      user: req.user._id,
      $or: [
        { title: searchRegex },
        { author: searchRegex },
        { genre: searchRegex },
        { description: searchRegex },
        { notes: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]
    }).sort({ createdAt: -1 });

    res.json(books);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// @route   GET /api/books
// @desc    Get all books for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/books/:id
// @desc    Get a specific book
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, user: req.user._id });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/books/:id
// @desc    Update a book
// @access  Private
router.put('/:id', auth, uploadSingle, optimizeImage, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = bookValidationSchema.validate(req.body, { 
      allowUnknown: true,
      stripUnknown: true 
    });
    
    if (error) {
      // Delete uploaded file if validation fails
      if (req.file) {
        deleteUploadedFile(req.file.filename);
      }
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.details.map(d => d.message) 
      });
    }

    // Find the existing book first
    const existingBook = await Book.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!existingBook) {
      // Delete uploaded file if book not found
      if (req.file) {
        deleteUploadedFile(req.file.filename);
      }
      return res.status(404).json({ message: 'Book not found' });
    }

    // Handle cover image update
    let updateData = { ...value };
    if (req.file) {
      // Delete old cover image if it exists and is not a default image
      if (existingBook.coverImage && existingBook.coverImage.startsWith('/uploads/')) {
        const oldFilename = existingBook.coverImage.replace('/uploads/', '');
        deleteUploadedFile(oldFilename);
      }
      updateData.coverImage = `/uploads/${req.file.filename}`;
    }

    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    console.error('Error updating book:', error);
    
    // Delete uploaded file if database save fails
    if (req.file) {
      deleteUploadedFile(req.file.filename);
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        details: errors 
      });
    }
    
    res.status(500).json({ message: 'Server error while updating book' });
  }
});

// @route   DELETE /api/books/:id
// @desc    Delete a book
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Delete associated cover image if it exists
    if (book.coverImage && book.coverImage.startsWith('/uploads/')) {
      const filename = book.coverImage.replace('/uploads/', '');
      deleteUploadedFile(filename);
    }

    res.json({ 
      message: 'Book deleted successfully',
      deletedBook: {
        id: book._id,
        title: book.title,
        author: book.author
      }
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Server error while deleting book' });
  }
});

// @route   GET /api/books/stats
// @desc    Get reading statistics for user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Book.getReadingStats(req.user._id);
    res.json({
      message: 'Statistics retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Server error while retrieving statistics' });
  }
});

// @route   GET /api/books/genres
// @desc    Get all genres for user's books
// @access  Private
router.get('/genres', auth, async (req, res) => {
  try {
    const genres = await Book.distinct('genre', { 
      user: req.user._id, 
      genre: { $ne: null, $ne: '' } 
    });
    
    res.json({
      message: 'Genres retrieved successfully',
      genres: genres.filter(genre => genre).sort()
    });
  } catch (error) {
    console.error('Error getting genres:', error);
    res.status(500).json({ message: 'Server error while retrieving genres' });
  }
});

// @route   GET /api/books/authors
// @desc    Get all authors for user's books
// @access  Private
router.get('/authors', auth, async (req, res) => {
  try {
    const authors = await Book.distinct('author', { 
      user: req.user._id, 
      author: { $ne: null, $ne: '' } 
    });
    
    res.json({
      message: 'Authors retrieved successfully',
      authors: authors.filter(author => author).sort()
    });
  } catch (error) {
    console.error('Error getting authors:', error);
    res.status(500).json({ message: 'Server error while retrieving authors' });
  }
});

// Error handling middleware for this router
router.use(handleUploadError);

module.exports = router;
