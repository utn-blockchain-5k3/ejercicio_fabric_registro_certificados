import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Certificate, CertStatus, ApiResponse, VerificationResult, ErrorCodes } from './types';

@Info({ title: 'CertificatesContract', description: 'Registro de Certificados Académicos Modernizado' })
export class CertificatesContract extends Contract {
  private readonly registrarMSP = 'Org1MSP';

  private async exists(ctx: Context, id: string): Promise<boolean> {
    const data = await ctx.stub.getState(id);
    return !!data && data.length > 0;
  }

  private assertRegistrar(ctx: Context): void {
    const msp = ctx.clientIdentity.getMSPID();
    if (msp !== this.registrarMSP) {
      throw new Error(
        `[${ErrorCodes.UNAUTHORIZED_OPERATION}] Operación permitida solo a Universidad/Registrar (${this.registrarMSP}), MSP actual: ${msp}`
      );
    }
  }

  /**
   * Validates certificate data format
   */
  private validateCertificate(cert: Certificate): void {
    if (!cert.id?.trim()) {
      throw new Error(`[${ErrorCodes.INVALID_CERTIFICATE_DATA}] ID requerido`);
    }
    if (!cert.alumno?.trim()) {
      throw new Error(`[${ErrorCodes.INVALID_CERTIFICATE_DATA}] Alumno requerido`);
    }
    if (!cert.carrera?.trim()) {
      throw new Error(`[${ErrorCodes.INVALID_CERTIFICATE_DATA}] Carrera requerida`);
    }
    if (!cert.issuer?.trim()) {
      throw new Error(`[${ErrorCodes.INVALID_CERTIFICATE_DATA}] Issuer requerido`);
    }

    // Validate ISO-8601 date format
    if (!cert.fechaEmision || isNaN(Date.parse(cert.fechaEmision))) {
      throw new Error(
        `[${ErrorCodes.INVALID_DATE_FORMAT}] Fecha de emisión debe estar en formato ISO-8601`
      );
    }

    // Validate SHA-256 hash format (64 hex characters)
    const sha256Regex = /^[a-fA-F0-9]{64}$/;
    if (!cert.hashDoc || !sha256Regex.test(cert.hashDoc)) {
      throw new Error(
        `[${ErrorCodes.INVALID_HASH_FORMAT}] Hash del documento debe ser SHA-256 válido (64 caracteres hexadecimales)`
      );
    }
  }

  /**
   * Issues a new academic certificate
   * @param ctx Transaction context
   * @param certJson Certificate data as JSON string
   * @returns Promise<void>
   */
  @Transaction()
  public async issueCertificate(ctx: Context, certJson: string): Promise<void> {
    this.assertRegistrar(ctx);

    let cert: Certificate;
    try {
      cert = JSON.parse(certJson) as Certificate;
    } catch {
      throw new Error(`[${ErrorCodes.INVALID_CERTIFICATE_DATA}] JSON inválido`);
    }

    this.validateCertificate(cert);

    if (await this.exists(ctx, cert.id)) {
      throw new Error(`[${ErrorCodes.CERTIFICATE_ALREADY_EXISTS}] El certificado ya existe`);
    }

    cert.estado = 'VIGENTE';
    await ctx.stub.putState(cert.id, Buffer.from(JSON.stringify(cert)));
    await ctx.stub.setEvent('CertificateIssued', Buffer.from(cert.id));
  }

  /**
   * Reads a certificate from the ledger
   * @param ctx Transaction context
   * @param id Certificate ID
   * @returns Certificate data as JSON string
   */
  @Transaction(false)
  @Returns('string')
  public async readCertificate(ctx: Context, id: string): Promise<string> {
    const data = await ctx.stub.getState(id);
    if (!data || data.length === 0) {
      throw new Error(`[${ErrorCodes.CERTIFICATE_NOT_FOUND}] Certificado no encontrado`);
    }
    const cert: Certificate = JSON.parse(data.toString());
    const response: ApiResponse<Certificate> = {
      success: true,
      data: cert,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(response);
  }

  /**
   * Revokes an existing certificate
   * @param ctx Transaction context
   * @param id Certificate ID
   * @param reason Revocation reason
   * @returns Promise<void>
   */
  @Transaction()
  public async revokeCertificate(ctx: Context, id: string, reason: string): Promise<void> {
    this.assertRegistrar(ctx);
    const data = await ctx.stub.getState(id);
    if (!data || data.length === 0) {
      throw new Error(`[${ErrorCodes.CERTIFICATE_NOT_FOUND}] Certificado no encontrado`);
    }
    const cert: Certificate = JSON.parse(data.toString());
    cert.estado = 'REVOCADO';
    cert.revocationReason = reason || cert.revocationReason || 'Sin razón especificada';
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(cert)));
    await ctx.stub.setEvent('CertificateRevoked', Buffer.from(id));
  }

    /**
   * Verifies the authenticity of a certificate by comparing hashes
   * @param ctx Transaction context
   * @param id Certificate ID
   * @param hashDoc Document hash to compare with
   * @returns Verification result with certificate data
   */
  @Transaction(false)
  @Returns('string')
  public async verifyCertificate(ctx: Context, id: string, hashDoc: string): Promise<string> {
    const certBuffer = await ctx.stub.getState(id);
    if (!certBuffer || certBuffer.length === 0) {
      throw new Error(`Certificate ${id} does not exist`);
    }

    const cert: Certificate = JSON.parse(certBuffer.toString());
    const verified = !hashDoc || cert.hashDoc === hashDoc;
    
    return JSON.stringify({
      id,
      verified,
      certificate: cert,
      verificationDate: new Date().toISOString()
    });
  }

  /**
   * Gets the complete history of a certificate
   * @param ctx Transaction context
   * @param id Certificate ID
   * @returns Certificate history as JSON string
   */
  @Transaction(false)
  @Returns('string')
  public async getCertificateHistory(ctx: Context, id: string): Promise<string> {
    const it = await ctx.stub.getHistoryForKey(id);
    const out: Array<{ txId: string; isDelete: boolean; value?: Certificate; timestamp: string }> = [];
    
    let res = await it.next();
    while (!res.done) {
      out.push({
        txId: res.value.txId,
        isDelete: res.value.isDelete,
        timestamp: new Date(res.value.timestamp.seconds.low * 1000).toISOString(),
        value: res.value.value ? JSON.parse(res.value.value.toString()) : undefined,
      });
      res = await it.next();
    }
    await it.close();
    
    return JSON.stringify(out);
  }

  /**
   * Query certificates by student name
   * @param ctx Transaction context
   * @param alumno Student name
   * @returns Array of certificates as JSON string
   */
  @Transaction(false)
  @Returns('string')
  public async queryByStudent(ctx: Context, alumno: string): Promise<string> {
    const query = {
      selector: { alumno },
      use_index: ['_design/indexAlumnoDoc', 'indexAlumno']
    };
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const results: Certificate[] = [];
    
    let res = await iterator.next();
    while (!res.done) {
      results.push(JSON.parse(res.value.value.toString()));
      res = await iterator.next();
    }
    await iterator.close();
    
    return JSON.stringify(results);
  }

  /**
   * Updates the document hash of an existing certificate
   * @param ctx Transaction context
   * @param id Certificate ID
   * @param newHashDoc New document hash
   * @returns Promise<void>
   */
  @Transaction()
  public async updateCertificateHash(ctx: Context, id: string, newHashDoc: string): Promise<void> {
    this.assertRegistrar(ctx);
    const data = await ctx.stub.getState(id);
    if (!data || data.length === 0) {
      throw new Error(`[${ErrorCodes.CERTIFICATE_NOT_FOUND}] Certificado no encontrado`);
    }
    
    const cert: Certificate = JSON.parse(data.toString());
    if (cert.estado !== 'VIGENTE') {
      throw new Error('Solo se puede actualizar hash cuando el certificado está VIGENTE');
    }
    
    // Validate new hash format
    const sha256Regex = /^[a-fA-F0-9]{64}$/;
    if (!sha256Regex.test(newHashDoc)) {
      throw new Error(`[${ErrorCodes.INVALID_HASH_FORMAT}] Hash debe ser SHA-256 válido`);
    }
    
    cert.hashDoc = newHashDoc;
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(cert)));
    await ctx.stub.setEvent('CertificateHashUpdated', Buffer.from(id));
  }
}