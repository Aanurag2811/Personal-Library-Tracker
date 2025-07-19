import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Input,
} from '@mui/material';

const BookForm = ({ open, onClose, onSubmit, book = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: book?.title || '',
    author: book?.author || '',
    genre: book?.genre || '',
    status: book?.status || 'To Read',
    description: book?.description || '',
    isbn: book?.isbn || '',
    publishedDate: book?.publishedDate || '',
    pageCount: book?.pageCount || '',
    rating: book?.rating || '',
    notes: book?.notes || '',
    coverImage: null,
  });

  const [imagePreview, setImagePreview] = useState(book?.coverImage || null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        coverImage: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Book' : 'Add New Book'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              name="title"
              label="Title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <TextField
              name="author"
              label="Author"
              value={formData.author}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <TextField
              name="genre"
              label="Genre"
              value={formData.genre}
              onChange={handleChange}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <MenuItem value="To Read">To Read</MenuItem>
                <MenuItem value="Reading">Reading</MenuItem>
                <MenuItem value="Read">Read</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                name="isbn"
                label="ISBN"
                value={formData.isbn}
                onChange={handleChange}
                fullWidth
              />
              
              <TextField
                name="publishedDate"
                label="Published Date"
                value={formData.publishedDate}
                onChange={handleChange}
                fullWidth
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                name="pageCount"
                label="Page Count"
                type="number"
                value={formData.pageCount}
                onChange={handleChange}
                fullWidth
              />
              
              <TextField
                name="rating"
                label="Rating (1-5)"
                type="number"
                value={formData.rating}
                onChange={handleChange}
                inputProps={{ min: 1, max: 5 }}
                fullWidth
              />
            </Box>
            
            <TextField
              name="notes"
              label="Notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
            
            <Box>
              <Typography variant="body2" gutterBottom>
                Book Cover (Optional)
              </Typography>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                fullWidth
              />
              {imagePreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button type="submit" color="primary" variant="contained">
            {isEditing ? 'Update' : 'Add'} Book
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BookForm;
