const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    defaultBookStatus: {
      type: String,
      enum: ['To Read', 'Reading', 'Read'],
      default: 'To Read'
    }
  },
  stats: {
    totalBooks: {
      type: Number,
      default: 0
    },
    booksRead: {
      type: Number,
      default: 0
    },
    currentlyReading: {
      type: Number,
      default: 0
    },
    toRead: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1, username: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update stats
userSchema.methods.updateStats = async function() {
  const Book = mongoose.model('Book');
  
  const stats = await Book.aggregate([
    { $match: { user: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Reset stats
  this.stats.totalBooks = 0;
  this.stats.booksRead = 0;
  this.stats.currentlyReading = 0;
  this.stats.toRead = 0;

  // Update stats based on aggregation
  stats.forEach(stat => {
    this.stats.totalBooks += stat.count;
    
    switch(stat._id) {
      case 'Read':
        this.stats.booksRead = stat.count;
        break;
      case 'Reading':
        this.stats.currentlyReading = stat.count;
        break;
      case 'To Read':
        this.stats.toRead = stat.count;
        break;
    }
  });

  await this.save();
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
