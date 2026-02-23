import { Request, Response, NextFunction } from 'express';

export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.locals.startTime = process.hrtime.bigint();
  next();
};
