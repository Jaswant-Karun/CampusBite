/**
 * CampusBite Centralized Error Handling Middleware
 * Suppresses internal stack traces, DB connection strings, and sensitive system details.
 */

function errorHandler(err, req, res, next) {
  // Log full error securely on the server console for diagnostics
  console.error('[CampusBite Server Error]:', err.stack || err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  
  // Prevent exposing file paths, MongoDB connection strings, or system internals
  let safeMessage = err.message || 'An unexpected server error occurred.';
  if (statusCode === 500) {
    if (safeMessage.includes('mongodb://') || safeMessage.includes(':\\') || safeMessage.includes('/Users/') || safeMessage.includes('node_modules')) {
      safeMessage = 'Internal server error. Request could not be processed.';
    }
  }

  res.status(statusCode).json({
    success: false,
    message: safeMessage
  });
}

module.exports = errorHandler;
