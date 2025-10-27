import path from 'path';
import { FabricConfig } from '../types';

export const fabricConfig: FabricConfig = {
  channelName: 'mychannel',
  chaincodeName: 'certificates',
  mspId: 'Org1MSP',
  cryptoPath: path.resolve(__dirname, '..', '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com'),
  keyDirectoryPath: path.resolve(__dirname, '..', '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'User1@org1.example.com', 'msp', 'keystore'),
  certDirectoryPath: path.resolve(__dirname, '..', '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'User1@org1.example.com', 'msp', 'signcerts'),
  tlsCertPath: path.resolve(__dirname, '..', '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'),
  peerEndpoint: 'grpc://localhost:7051',
  peerHostAlias: 'peer0.org1.example.com'
};

export const serverConfig = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  logLevel: process.env.LOG_LEVEL ?? 'info'
};

export default {
  fabric: fabricConfig,
  server: serverConfig
};