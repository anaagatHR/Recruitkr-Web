import { StatusCodes } from 'http-status-codes';

export const notFoundHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (error, _req, res, _next) => {
  if (error?.name === 'MulterError') {
    const statusCode =
      error.code === 'LIMIT_FILE_SIZE'
        ? StatusCodes.PAYLOAD_TOO_LARGE
        : StatusCodes.BAD_REQUEST;
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'File size must be 5MB or smaller'
        : 'Invalid file upload request';

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    console.error(error);
  }

  const response = {
    success: false,
    message: error.message || 'Internal server error',
  };

  if (error.details) {
    response.details = error.details;
  }

  res.status(statusCode).json(response);
};

