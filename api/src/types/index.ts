// Tipos para certificados
export interface Certificate {
  id: string;
  alumno: string;
  carrera: string;
  fechaEmision: string;
  issuer: string;
  promedio: number;
  hashDoc: string;
  estado: CertStatus;
  revocationReason?: string;
}

export type CertStatus = 'VIGENTE' | 'REVOCADO' | 'SUSPENDIDO';

// Tipos para verificación de certificados
export interface VerificationResult {
  id: string;
  verified: boolean;
  certificate: Certificate;
  verificationDate: string;
}

// Tipos para respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  result?: string;
  error?: string;
  message?: string;
  timestamp?: string;
  certificateId?: string;
  student?: string;
  count?: number;
  hashDoc?: string;
}

// Tipos para requests
export interface CreateCertificateRequest {
  id: string;
  alumno: string;
  carrera: string;
  fechaEmision: string;
  issuer: string;
  promedio: number;
  hashDoc: string;
}

export interface VerifyCertificateRequest {
  hashDoc: string;
}

export interface RevokeCertificateRequest {
  razon?: string;
}

export interface UpdateHashRequest {
  newHashDoc: string;
}

// Tipos para configuración
export interface FabricConfig {
  channelName: string;
  chaincodeName: string;
  mspId: string;
  cryptoPath: string;
  keyDirectoryPath: string;
  certDirectoryPath: string;
  tlsCertPath: string;
  peerEndpoint: string;
  peerHostAlias: string;
}

// Tipos para errores
export interface ErrorResponse {
  error: string;
  code?: string | number;
  details?: any;
  timestamp: string;
}

// Códigos de error del chaincode
export enum ErrorCodes {
  CERTIFICATE_NOT_FOUND = 'CERTIFICATE_NOT_FOUND',
  CERTIFICATE_ALREADY_EXISTS = 'CERTIFICATE_ALREADY_EXISTS',
  INVALID_CERTIFICATE_DATA = 'INVALID_CERTIFICATE_DATA',
  UNAUTHORIZED_OPERATION = 'UNAUTHORIZED_OPERATION',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_HASH_FORMAT = 'INVALID_HASH_FORMAT',
  CERTIFICATE_ALREADY_REVOKED = 'CERTIFICATE_ALREADY_REVOKED'
}