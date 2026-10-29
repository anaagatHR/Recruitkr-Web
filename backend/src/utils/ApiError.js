export class ApiError extends Error {
  // `code` is a stable machine-readable reason (e.g. PROFILE_INCOMPLETE) and
  // `data` any structured payload the client needs to act on it.
  constructor(statusCode, message, details = null, { code, data } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.data = data;
  }
}
