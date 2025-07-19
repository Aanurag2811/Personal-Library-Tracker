import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BookCard from '../components/BookCard';
import BookForm from '../components/BookForm';
import { booksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks();
      setBooks(response.data);
    } catch (error) {
      setError('Failed to fetch books');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (bookData) => {
    try {
      await booksAPI.createBook(bookData);
      fetchBooks();
      setError(null);
    } catch (error) {
      setError('Failed to add book');
      console.error(error);
    }
  };

  const handleEditBook = async (bookData) => {
    try {
      await booksAPI.updateBook(editingBook._id, bookData);
      fetchBooks();
      setEditingBook(null);
      setError(null);
    } catch (error) {
      setError('Failed to update book');
      console.error(error);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await booksAPI.deleteBook(bookId);
        fetchBooks();
        setError(null);
      } catch (error) {
        setError('Failed to delete book');
        console.error(error);
      }
    }
  };

  const openEditForm = (book) => {
    setEditingBook(book);
    setOpenForm(true);
  };

  const closeForm = () => {
    setOpenForm(false);
    setEditingBook(null);
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || book.status === statusFilter;
    const matchesAuthor = !authorFilter || book.author.toLowerCase().includes(authorFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesAuthor;
  });

  const getStatusCounts = () => {
    const counts = books.reduce((acc, book) => {
      acc[book.status] = (acc[book.status] || 0) + 1;
      return acc;
    }, {});
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to your Library, {user?.firstName || user?.username}!
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip label={`To Read: ${statusCounts['To Read'] || 0}`} variant="outlined" />
          <Chip label={`Reading: ${statusCounts['Reading'] || 0}`} color="primary" />
          <Chip label={`Read: ${statusCounts['Read'] || 0}`} color="success" />
          <Chip label={`Total: ${books.length}`} variant="filled" />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            placeholder="Search books by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="To Read">To Read</MenuItem>
              <MenuItem value="Reading">Reading</MenuItem>
              <MenuItem value="Read">Read</MenuItem>
            </Select>
          </FormControl>

          <TextField
            placeholder="Filter by author..."
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenForm(true)}
          >
            Add Book
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {filteredBooks.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {books.length === 0 
              ? 'No books in your library yet. Start by adding your first book!'
              : 'No books match your current filters.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredBooks.map((book) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={book._id}>
              <BookCard
                book={book}
                onEdit={openEditForm}
                onDelete={handleDeleteBook}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <BookForm
        open={openForm}
        onClose={closeForm}
        onSubmit={editingBook ? handleEditBook : handleAddBook}
        book={editingBook}
        isEditing={!!editingBook}
      />
    </Container>
  );
};

export default DashboardPage;
