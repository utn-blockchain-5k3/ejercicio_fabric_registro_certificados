import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createPrivateKey } from 'crypto';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Gateway, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import { fabricConfig } from '../config';

interface FabricConnection {
  gateway: Gateway;
  contract: Contract;
}

export class FabricService {
  private static instance: FabricService;
  
  private constructor() {}
  
  public static getInstance(): FabricService {
    if (!FabricService.instance) {
      FabricService.instance = new FabricService();
    }
    return FabricService.instance;
  }

  public async getConnection(): Promise<FabricConnection> {
    try {
      // Create gRPC connection to the peer with TLS
      const tlsCertData = readFileSync(fabricConfig.tlsCertPath);
      const credentials = grpc.credentials.createSsl(tlsCertData);
      
      const client = new grpc.Client(
        fabricConfig.peerEndpoint.replace('grpc://', ''),
        credentials,
        {
          'grpc.keepalive_time_ms': 120000,
          'grpc.keepalive_timeout_ms': 20000,
          'grpc.keepalive_permit_without_calls': 1,
          'grpc.http2.max_pings_without_data': 0,
          'grpc.http2.min_time_between_pings_ms': 10000,
          'grpc.http2.min_ping_interval_without_data_ms': 5000
        }
      );

      // Get the private key
      const keyFiles = require('fs').readdirSync(fabricConfig.keyDirectoryPath);
      const keyPath = resolve(fabricConfig.keyDirectoryPath, keyFiles[0]);
      const privateKeyData = readFileSync(keyPath);

      // Get the certificate
      const certFiles = require('fs').readdirSync(fabricConfig.certDirectoryPath);
      const certPath = resolve(fabricConfig.certDirectoryPath, certFiles[0]);
      const certificateData = readFileSync(certPath);

      // Create identity and signer
      const identity: Identity = {
        mspId: fabricConfig.mspId,
        credentials: certificateData
      };

      const privateKey = createPrivateKey(privateKeyData);
      const signer: Signer = signers.newPrivateKeySigner(privateKey);

      // Connect to the gateway
      const gateway = connect({
        client,
        identity,
        signer,
        evaluateOptions: () => ({
          deadline: Date.now() + 5000, // 5 seconds
        }),
        endorseOptions: () => ({
          deadline: Date.now() + 15000, // 15 seconds
        }),
        submitOptions: () => ({
          deadline: Date.now() + 5000, // 5 seconds
        }),
        commitStatusOptions: () => ({
          deadline: Date.now() + 60000, // 1 minute
        }),
      });

      // Get the network and contract
      const network = gateway.getNetwork(fabricConfig.channelName);
      const contract = network.getContract(fabricConfig.chaincodeName);

      return { gateway, contract };
    } catch (error) {
      console.error('Error connecting to Fabric:', error);
      throw new Error(`Failed to connect to Hyperledger Fabric: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async executeTransaction(
    functionName: string,
    ...args: string[]
  ): Promise<string> {
    const { gateway, contract } = await this.getConnection();
    
    try {
      const result = await contract.submitTransaction(functionName, ...args);
      const resultString = Buffer.from(result).toString('utf8');
      return resultString;
    } finally {
      gateway.close();
    }
  }

  public async evaluateTransaction(
    functionName: string,
    ...args: string[]
  ): Promise<string> {
    const { gateway, contract } = await this.getConnection();
    
    try {
      const result = await contract.evaluateTransaction(functionName, ...args);
      const resultString = Buffer.from(result).toString('utf8');
      return resultString;
    } finally {
      gateway.close();
    }
  }
}

export const fabricService = FabricService.getInstance();