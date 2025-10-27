import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  let statusCode = 500;
  let message = 'Internal server error';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.message.includes('CERTIFICATE_NOT_FOUND')) {
    statusCode = 404;
    message = 'Certificate not found';
  } else if (error.message.includes('CERTIFICATE_ALREADY_EXISTS')) {
    statusCode = 409;
    message = 'Certificate already exists';
  } else if (error.message.includes('INVALID_CERTIFICATE_DATA')) {
    statusCode = 400;
    message = 'Invalid certificate data';
  } else if (error.message.includes('UNAUTHORIZED_OPERATION')) {
    statusCode = 403;
    message = 'Unauthorized operation';
  }

  const errorResponse: ErrorResponse = {
    error: message,
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};