import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  IconButton,
  CardActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const BookCard = ({ book, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'To Read':
        return 'default';
      case 'Reading':
        return 'primary';
      case 'Read':
        return 'success';
      default:
        return 'default';
    }
  };

  const defaultCover = '/api/placeholder/150/200?text=No+Cover';

  return (
    <Card sx={{ maxWidth: 345, m: 1 }}>
      <CardMedia
        component="img"
        height="200"
        image={book.coverImage || defaultCover}
        alt={book.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          by {book.author}
        </Typography>
        {book.genre && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Genre: {book.genre}
          </Typography>
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip 
            label={book.status} 
            color={getStatusColor(book.status)}
            size="small"
          />
          {book.rating && (
            <Typography variant="body2">
              ⭐ {book.rating}/5
            </Typography>
          )}
        </Box>
        {book.notes && (
          <Typography variant="body2" sx={{ mt: 1 }} noWrap>
            Notes: {book.notes}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <IconButton onClick={() => onEdit(book)} color="primary">
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => onDelete(book._id)} color="error">
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default BookCard;
