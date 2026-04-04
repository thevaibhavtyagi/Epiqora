/**
 * Global error handler middleware
 * Catches and formats all errors in a consistent way
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle multer errors specifically
  if (err.name === 'MulterError') {
    statusCode = 400;
    code = err.code;

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum allowed (10MB)';
      code = 'FILE_TOO_LARGE';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
      code = 'TOO_MANY_FILES';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
      code = 'INVALID_FILE_FIELD';
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
    },
  });
};

export default errorHandler;
