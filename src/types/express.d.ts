import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      // Extend request interface here as needed
    }
  }
}

export {};
