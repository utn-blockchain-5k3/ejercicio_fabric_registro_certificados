import { Contract } from 'fabric-contract-api';
import { CertificatesContract } from './certificates.contract';

export { CertificatesContract } from './certificates.contract';
export const contracts: typeof Contract[] = [CertificatesContract];