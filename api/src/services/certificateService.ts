import { 
  Certificate, 
  CreateCertificateRequest, 
  VerificationResult, 
  ApiResponse 
} from '../types';
import { fabricService } from '../utils/fabric';

export class CertificateService {
  
  /**
   * Obtener un certificado por ID
   */
  async getCertificate(id: string): Promise<Certificate> {
    try {
      const result = await fabricService.evaluateTransaction('readCertificate', id);
      return JSON.parse(result) as Certificate;
    } catch (error) {
      console.error(`Error getting certificate ${id}:`, error);
      throw new Error(`Failed to get certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crear un nuevo certificado
   */
  async createCertificate(certificateData: CreateCertificateRequest): Promise<void> {
    try {
      const certJson = JSON.stringify(certificateData);
      await fabricService.executeTransaction('issueCertificate', certJson);
    } catch (error) {
      console.error('Error creating certificate:', error);
      throw new Error(`Failed to create certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verificar un certificado
   */
  async verifyCertificate(id: string, hashDoc: string): Promise<VerificationResult> {
    try {
      const result = await fabricService.evaluateTransaction('verifyCertificate', id, hashDoc);
      return JSON.parse(result) as VerificationResult;
    } catch (error) {
      console.error(`Error verifying certificate ${id}:`, error);
      throw new Error(`Failed to verify certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Revocar un certificado
   */
  async revokeCertificate(id: string, reason?: string): Promise<void> {
    try {
      await fabricService.executeTransaction('revokeCertificate', id, reason ?? 'No especificada');
    } catch (error) {
      console.error(`Error revoking certificate ${id}:`, error);
      throw new Error(`Failed to revoke certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Actualizar hash de un certificado
   */
  async updateCertificateHash(id: string, newHashDoc: string): Promise<void> {
    try {
      await fabricService.executeTransaction('updateCertificateHash', id, newHashDoc);
    } catch (error) {
      console.error(`Error updating certificate hash ${id}:`, error);
      throw new Error(`Failed to update certificate hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtener historial de un certificado
   */
  async getCertificateHistory(id: string): Promise<any[]> {
    try {
      const result = await fabricService.evaluateTransaction('getCertificateHistory', id);
      return JSON.parse(result) as any[];
    } catch (error) {
      console.error(`Error getting certificate history ${id}:`, error);
      throw new Error(`Failed to get certificate history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Buscar certificados por estudiante
   */
  async queryByStudent(alumno: string): Promise<Certificate[]> {
    try {
      const result = await fabricService.evaluateTransaction('queryByStudent', alumno);
      return JSON.parse(result) as Certificate[];
    } catch (error) {
      console.error(`Error querying certificates for student ${alumno}:`, error);
      throw new Error(`Failed to query certificates by student: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const certificateService = new CertificateService();