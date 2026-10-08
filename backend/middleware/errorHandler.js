/**
 * CampusBite Centralized Error Handling Middleware
 */

function errorHandler(err, req, res, next) {
  console.error('[CampusBite Error]:', err.stack || err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

module.exports = errorHandler;
