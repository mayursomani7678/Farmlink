const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds limit' });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files' });
  }

  // Custom errors
  if (err.message.includes('Only')) {
    return res.status(400).json({ error: err.message });
  }

  // Database errors
  if (err.code === '23505') {
    return res.status(400).json({ error: 'Duplicate entry' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Invalid reference' });
  }

  // Default error
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;
