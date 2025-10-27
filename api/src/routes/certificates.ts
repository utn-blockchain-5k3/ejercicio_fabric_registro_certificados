import { Router, Request, Response } from 'express';
import { 
  ApiResponse, 
  CreateCertificateRequest, 
  VerifyCertificateRequest, 
  RevokeCertificateRequest,
  UpdateHashRequest
} from '../types';
import { certificateService } from '../services/certificateService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get certificate by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  console.log('Getting certificate:', id);
  
  const certificate = await certificateService.getCertificate(id);
  
  const response: ApiResponse = {
    success: true,
    data: certificate,
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
}));

// Create new certificate
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const certificateData: CreateCertificateRequest = req.body;
  console.log('Creating certificate:', certificateData.id);
  
  await certificateService.createCertificate(certificateData);
  
  const response: ApiResponse = {
    success: true,
    message: 'Certificate created successfully',
    data: { id: certificateData.id, estado: 'VIGENTE' },
    timestamp: new Date().toISOString()
  };
  
  res.status(201).json(response);
}));

// Verify certificate
router.post('/:id/verify', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const { hashDoc }: VerifyCertificateRequest = req.body;
  
  console.log('Verifying certificate:', id, 'with hash:', hashDoc);
  
  if (!hashDoc) {
    const response: ApiResponse = {
      success: false,
      error: 'hashDoc is required'
    };
    res.status(400).json(response);
    return;
  }
  
  const verification = await certificateService.verifyCertificate(id, hashDoc);
  
  const response: ApiResponse = {
    success: true,
    data: verification,
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
}));

// Revoke certificate
router.post('/:id/revoke', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const { razon }: RevokeCertificateRequest = req.body;
  
  console.log('Revoking certificate:', id, 'with reason:', razon);
  
  await certificateService.revokeCertificate(id, razon);
  
  const response: ApiResponse = {
    success: true,
    message: 'Certificate revoked successfully',
    certificateId: id,
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
}));

// Update certificate hash
router.put('/:id/hash', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const { newHashDoc }: UpdateHashRequest = req.body;
  
  console.log('Updating certificate hash:', id);
  
  if (!newHashDoc) {
    const response: ApiResponse = {
      success: false,
      error: 'newHashDoc is required'
    };
    res.status(400).json(response);
    return;
  }
  
  await certificateService.updateCertificateHash(id, newHashDoc);
  
  const response: ApiResponse = {
    success: true,
    message: 'Certificate hash updated successfully',
    certificateId: id,
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
}));

// Get certificate history
router.get('/:id/history', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  console.log('Getting certificate history:', id);
  
  const history = await certificateService.getCertificateHistory(id);
  
  const response: ApiResponse = {
    success: true,
    data: history,
    certificateId: id,
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
}));

// Query certificates by student
router.get('/student/:alumno', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const alumno = req.params.alumno!;
  console.log('Querying certificates for student:', alumno);
  
  const certificates = await certificateService.queryByStudent(alumno);
  
  const response: ApiResponse = {
    success: true,
    data: certificates,
    student: alumno,
    count: Array.isArray(certificates) ? certificates.length : 1,
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
}));

export default router;