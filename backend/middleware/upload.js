const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `book-cover-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter
});

// Middleware to optimize images after upload
const optimizeImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const outputPath = path.join(uploadDir, 'optimized-' + req.file.filename);

    // Optimize image using sharp
    await sharp(inputPath)
      .resize(400, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality: 80,
        progressive: true
      })
      .toFile(outputPath);

    // Remove original file and rename optimized file
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath, inputPath);

    next();
  } catch (error) {
    console.error('Image optimization error:', error);
    // Continue without optimization if it fails
    next();
  }
};

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Only one file allowed.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({
      message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed.'
    });
  }

  next(err);
};

// Utility function to delete uploaded file
const deleteUploadedFile = (filename) => {
  if (filename) {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// Single file upload for book covers
const uploadSingle = upload.single('coverImage');

// Multiple files upload (for future features)
const uploadMultiple = upload.array('images', 5);

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  optimizeImage,
  handleUploadError,
  deleteUploadedFile
};

// Export single as default for backward compatibility
module.exports.single = uploadSingle;
