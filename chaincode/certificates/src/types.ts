export type CertStatus = 'VIGENTE' | 'REVOCADO';

export interface Certificate {
  id: string;
  alumno: string;         // DNI/email + nombre
  carrera: string;
  fechaEmision: string;   // ISO-8601
  issuer: string;         // Org/MSP o nombre universidad
  hashDoc: string;        // SHA-256 del PDF
  estado: CertStatus;
  revocationReason?: string;
}

// Tipos para respuestas estructuradas
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface VerificationResult {
  exists: boolean;
  estado?: CertStatus;
  hashOk?: boolean;
  certificate?: Certificate;
}

// Códigos de error estructurados
export enum ErrorCodes {
  CERTIFICATE_NOT_FOUND = 'CERT_001',
  CERTIFICATE_ALREADY_EXISTS = 'CERT_002',
  INVALID_CERTIFICATE_DATA = 'CERT_003',
  UNAUTHORIZED_OPERATION = 'CERT_004',
  INVALID_DATE_FORMAT = 'CERT_005',
  INVALID_HASH_FORMAT = 'CERT_006'
}