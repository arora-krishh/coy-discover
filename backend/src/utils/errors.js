// One error type for "the client did something wrong".
// Services throw it; the error middleware in app.js turns it into JSON.
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (code, message) => new HttpError(400, code, message);
export const notFound = (code, message) => new HttpError(404, code, message);
export const conflict = (code, message) => new HttpError(409, code, message);
