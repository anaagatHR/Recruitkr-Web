import { StatusCodes } from 'http-status-codes';

export const notFoundHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (error, _req, res, _next) => {
  if (error?.code === 'CORS_ORIGIN_REJECTED') {
    console.warn('[cors] request blocked', {
      origin: error.origin || 'unknown',
      message: error.message,
    });

    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: '',
    });
  }

  if (error?.name === 'MulterError') {
    const statusCode =
      error.code === 'LIMIT_FILE_SIZE'
        ? StatusCodes.PAYLOAD_TOO_LARGE
        : StatusCodes.BAD_REQUEST;
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'The file is too large. Please upload a smaller file.'
        : 'Invalid file upload request';

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  const isJwtError =
    error?.name === 'JsonWebTokenError' ||
    error?.name === 'TokenExpiredError' ||
    error?.name === 'NotBeforeError';

  const statusCode = error.statusCode || (isJwtError ? StatusCodes.UNAUTHORIZED : StatusCodes.INTERNAL_SERVER_ERROR);

  const isServerError = statusCode >= StatusCodes.INTERNAL_SERVER_ERROR;

  if (isServerError) {
    console.error(error);
  } else if (isJwtError) {
    console.warn('[jwt] request rejected', {
      name: error.name,
      message: error.message,
    });
  }

  // Never leak internal error details (stack-adjacent messages, driver errors,
  // file paths) to clients on a 5xx. Intentional 4xx errors (ApiError) keep
  // their human-readable message; unexpected 5xx get a generic message in
  // production. In development the real message is preserved for debugging.
  const isProduction = process.env.NODE_ENV === 'production';
  const safeMessage =
    isServerError && isProduction ? 'Internal server error' : error.message || 'Internal server error';

  const response = {
    success: false,
    message: safeMessage,
  };

  if (error.details) {
    response.details = error.details;
  }

  res.status(statusCode).json(response);
};
