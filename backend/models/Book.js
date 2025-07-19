const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  genre: {
    type: String,
    trim: true,
    maxlength: [50, 'Genre cannot exceed 50 characters']
  },
  status: {
    type: String,
    required: [true, 'Reading status is required'],
    enum: {
      values: ['To Read', 'Reading', 'Read'],
      message: 'Status must be either "To Read", "Reading", or "Read"'
    },
    default: 'To Read'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  isbn: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow empty ISBN or validate ISBN-10/ISBN-13 format
        if (!v) return true;
        // Basic ISBN validation (remove hyphens and check length)
        const cleanISBN = v.replace(/-/g, '');
        return /^[0-9]{10}$|^[0-9]{13}$/.test(cleanISBN);
      },
      message: 'Please enter a valid ISBN-10 or ISBN-13'
    }
  },
  publishedDate: {
    type: String,
    trim: true
  },
  pageCount: {
    type: Number,
    min: [1, 'Page count must be at least 1'],
    max: [50000, 'Page count cannot exceed 50,000']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5'],
    validate: {
      validator: function(v) {
        return v === null || v === undefined || (v >= 1 && v <= 5);
      },
      message: 'Rating must be between 1 and 5'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  coverImage: {
    type: String,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  // Additional metadata
  dateStarted: {
    type: Date
  },
  dateFinished: {
    type: Date
  },
  readingDuration: {
    type: Number, // in days
    min: 0
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  purchaseDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  series: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Series name cannot exceed 100 characters']
    },
    number: {
      type: Number,
      min: 1
    }
  },
  language: {
    type: String,
    trim: true,
    maxlength: [50, 'Language cannot exceed 50 characters'],
    default: 'English'
  },
  format: {
    type: String,
    enum: ['Physical', 'Ebook', 'Audiobook'],
    default: 'Physical'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookSchema.index({ user: 1, status: 1 });
bookSchema.index({ user: 1, title: 'text', author: 'text' });
bookSchema.index({ user: 1, genre: 1 });
bookSchema.index({ user: 1, rating: -1 });
bookSchema.index({ user: 1, createdAt: -1 });

// Pre-save middleware to set reading dates
bookSchema.pre('save', function(next) {
  const now = new Date();
  
  // Set dateStarted when status changes to "Reading"
  if (this.isModified('status')) {
    if (this.status === 'Reading' && !this.dateStarted) {
      this.dateStarted = now;
    }
    
    // Set dateFinished and calculate reading duration when status changes to "Read"
    if (this.status === 'Read' && !this.dateFinished) {
      this.dateFinished = now;
      
      if (this.dateStarted) {
        const timeDiff = this.dateFinished.getTime() - this.dateStarted.getTime();
        this.readingDuration = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert to days
      }
    }
  }
  
  next();
});

// Post-save middleware to update user stats
bookSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(doc.user);
    if (user) {
      await user.updateStats();
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
});

// Post-remove middleware to update user stats
bookSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(doc.user);
      if (user) {
        await user.updateStats();
      }
    } catch (error) {
      console.error('Error updating user stats after deletion:', error);
    }
  }
});

// Virtual for reading progress (if it's currently being read)
bookSchema.virtual('readingProgress').get(function() {
  if (this.status === 'Reading' && this.dateStarted) {
    const now = new Date();
    const daysReading = Math.ceil((now.getTime() - this.dateStarted.getTime()) / (1000 * 3600 * 24));
    return {
      daysReading,
      startDate: this.dateStarted
    };
  }
  return null;
});

// Virtual for formatted publication date
bookSchema.virtual('formattedPublishedDate').get(function() {
  if (!this.publishedDate) return null;
  
  // Handle different date formats
  const date = new Date(this.publishedDate);
  if (isNaN(date.getTime())) {
    return this.publishedDate; // Return as-is if not a valid date
  }
  
  return date.toLocaleDateString();
});

// Method to get similar books (by author or genre)
bookSchema.methods.getSimilarBooks = async function(limit = 5) {
  return await this.constructor.find({
    user: this.user,
    _id: { $ne: this._id },
    $or: [
      { author: this.author },
      { genre: this.genre }
    ]
  }).limit(limit);
};

// Static method to get reading statistics for a user
bookSchema.statics.getReadingStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalBooks: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        totalPages: { $sum: '$pageCount' },
        booksRead: {
          $sum: { $cond: [{ $eq: ['$status', 'Read'] }, 1, 0] }
        },
        booksReading: {
          $sum: { $cond: [{ $eq: ['$status', 'Reading'] }, 1, 0] }
        },
        booksToRead: {
          $sum: { $cond: [{ $eq: ['$status', 'To Read'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalBooks: 0,
    averageRating: 0,
    totalPages: 0,
    booksRead: 0,
    booksReading: 0,
    booksToRead: 0
  };
};

// Enable virtual fields in JSON
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);
