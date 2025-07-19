const express = require('express');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const axios = require('axios');

const router = express.Router();

// @route   POST /api/books
// @desc    Add a book
// @access  Private
router.post('/', auth, upload.single('coverImage'), async (req, res) => {
  try {
    const { title, author, genre, status, ...others } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

    const book = new Book({
      title,
      author,
      genre,
      status,
      coverImage,
      user: req.user._id,
      ...others
    });

    await book.save();
    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Optional: Google Books API integration for book search
// @route   GET /api/books/search
// @desc    Search books via Google Books API
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.GOOGLE_BOOKS_API_KEY}`);
    const books = response.data.items.map(book => ({
      title: book.volumeInfo.title,
      author: book.volumeInfo.authors.join(', '),
      genre: book.volumeInfo.categories ? book.volumeInfo.categories[0] : 'Unknown',
      description: book.volumeInfo.description,
      isbn: book.volumeInfo.industryIdentifiers ? book.volumeInfo.industryIdentifiers[0].identifier : 'N/A',
      publishedDate: book.volumeInfo.publishedDate,
      pageCount: book.volumeInfo.pageCount,
      coverImage: book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : null,
    }));

    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
router.put('/:id', auth, upload.single('coverImage'), async (req, res) => {
  try {
    const { title, author, genre, status, ...others } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { title, author, genre, status, coverImage, ...others } },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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

    res.json({ message: 'Book removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
