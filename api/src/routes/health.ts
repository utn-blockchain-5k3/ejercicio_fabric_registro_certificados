import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const healthResponse: ApiResponse = {
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  };
  
  res.json(healthResponse);
}));

export default router;