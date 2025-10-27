# Ejercicio de Registro de Certificados Académicos con Hyperledger Fabric

Sistema completo de gestión de certificados académicos utilizando blockchain Hyperledger Fabric con chaincode en TypeScript y API REST.

## 🎯 Objetivo del Ejercicio

Implementar un sistema de certificados académicos descentralizado que permita:
- Emisión de certificados verificables
- Verificación de autenticidad mediante hash
- Revocación de certificados
- Trazabilidad completa mediante blockchain

## 🏗️ Arquitectura del Sistema

```
ejercicio_registro_certificados/
├── chaincode/certificates/     # Smart contract en TypeScript
├── api/                       # API REST en TypeScript  
└── README.md                  # Instrucciones completas
```

**Nota**: `fabric-samples` se descarga por separado usando el comando oficial de Hyperledger Fabric.

## 📋 Paso a Paso para Estudiantes

### 🔧 Paso 1: Preparación del Entorno

#### 1.1 Prerrequisitos
- Docker y Docker Compose
- Node.js 18+ y npm
- Git
- 4GB RAM disponible
- 10GB espacio en disco

#### 1.2 Limpiar el entorno Docker
```bash
# Detener y limpiar todos los contenedores Docker
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -f
docker volume prune -f

# Verificar que no hay contenedores corriendo
docker ps
```

#### 1.3 Descargar fabric-samples
```bash
# Descargar el script de instalación oficial (método recomendado por Hyperledger)
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh

# Instalar fabric-samples, binarios y imágenes Docker con versiones específicas
./install-fabric.sh --fabric-version 2.5.4 --ca-version 1.5.5 docker binary samples

# Limpiar el script de instalación
rm install-fabric.sh
```

**¿Qué hace este comando?**
- Descarga `fabric-samples/` (ejemplos y scripts)
- Descarga binarios CLI en `fabric-samples/bin/` (peer, orderer, cryptogen, etc.)
- Descarga imágenes Docker de Hyperledger Fabric v2.5.4 y Fabric-CA v1.5.5
- Etiqueta automáticamente las imágenes como 'latest' para compatibilidad

**Alternativa paso a paso** (si prefieres control granular):
```bash
# Solo samples
./install-fabric.sh --fabric-version 2.5.4 samples

# Solo binarios
./install-fabric.sh --fabric-version 2.5.4 --ca-version 1.5.5 binary

# Solo imágenes Docker
./install-fabric.sh --fabric-version 2.5.4 --ca-version 1.5.5 docker
```

**Importante**: 
- Este comando debe ejecutarse desde la raíz del proyecto `ejercicio_registro_certificados/`
- Solo necesitas ejecutarlo una vez
- La carpeta `fabric-samples/` se creará automáticamente

#### 1.4 Verificar la instalación
```bash
# Verificar que fabric-samples se descargó correctamente
cd fabric-samples/test-network
./network.sh --help
```

### 🚀 Paso 2: Levantar la Red Blockchain

#### 2.1 Inicializar la red Fabric
```bash
cd fabric-samples/test-network

# Levantar la red con CA (Certificate Authority)
./network.sh up createChannel -ca

# Verificar que los contenedores están corriendo
docker ps
```

#### 2.2 Verificar la red
```bash
# Deberías ver estos contenedores:
# - peer0.org1.example.com
# - peer0.org2.example.com  
# - orderer.example.com
# - ca_org1, ca_org2, ca_orderer
```

### 📜 Paso 3: Preparar el Chaincode

#### 3.1 Instalar dependencias del chaincode
```bash
cd ../../chaincode/certificates
npm install
```

#### 3.2 Compilar el chaincode TypeScript
```bash
npm run build
```

### 📦 Paso 4: Desplegar el Chaincode

#### 4.1 Usar el script de despliegue automatizado
```bash
cd ../../fabric-samples/test-network

# Desplegar chaincode usando el script oficial
./scripts/deployCC.sh -ccn certificates -ccp ../../chaincode/certificates -ccl node -ccv 1.0 -ccs 1
```

**Parámetros del script:**
- `-ccn certificates`: Nombre del chaincode
- `-ccp ../../chaincode/certificates`: Ruta al código del chaincode
- `-ccl node`: Lenguaje del chaincode (Node.js/TypeScript)
- `-ccv 1.0`: Versión del chaincode
- `-ccs 1`: Número de secuencia

**¿Qué hace este script automáticamente?**
- ✅ Empaqueta el chaincode
- ✅ Lo instala en ambas organizaciones (Org1 y Org2)
- ✅ Aprueba el chaincode para ambas organizaciones
- ✅ Hace commit del chaincode en el canal
- ✅ Configura todas las variables de entorno necesarias

#### 4.2 Verificar el despliegue
```bash
# Verificar que el chaincode está desplegado
peer lifecycle chaincode querycommitted --channelID mychannel --name certificates
```

### 🧪 Paso 5: Probar el Chaincode

#### 5.1 Crear certificados de prueba
```bash
# Crear certificado 1
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n certificates \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"issueCertificate","Args":["{\"id\":\"CERT-001\",\"alumno\":\"Juan Pérez\",\"carrera\":\"Ingeniería de Sistemas\",\"fechaEmision\":\"2023-12-15\",\"issuer\":\"Universidad Nacional\",\"promedio\":80.5,\"hashDoc\":\"a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456\"}"]}'

# Crear certificado 2
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n certificates \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"issueCertificate","Args":["{\"id\":\"CERT-002\",\"alumno\":\"María García\",\"carrera\":\"Ingeniería Civil\",\"fechaEmision\":\"2023-11-20\",\"issuer\":\"Universidad Nacional\",\"promedio\":88.2,\"hashDoc\":\"b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567\"}"]}'
```

#### 5.2 Verificar que se crearon correctamente
```bash
# Leer certificado 1
peer chaincode query \
  -C mychannel \
  -n certificates \
  -c '{"Args":["readCertificate","CERT-001"]}'

# Leer certificado 2  
peer chaincode query \
  -C mychannel \
  -n certificates \
  -c '{"Args":["readCertificate","CERT-002"]}'
```

### 🌐 Paso 6: Configurar y Ejecutar la API

#### 6.1 Instalar dependencias de la API
```bash
cd ../../api
npm install
```

#### 6.2 Configurar variables de entorno
```bash
# Crear archivo .env
cat > .env << EOF
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
LOG_LEVEL=info
EOF
```

#### 6.3 Compilar y ejecutar la API
```bash
# Compilar TypeScript
npm run build

# Ejecutar en modo desarrollo
npm run dev
```

### 🧪 Paso 7: Probar la API REST

#### 7.1 Health Check
```bash
curl http://localhost:3001/api/health
```

#### 7.2 Leer certificado existente
```bash
curl http://localhost:3001/api/certificates/CERT-001
```

#### 7.3 Crear nuevo certificado
```bash
curl -X POST http://localhost:3001/api/certificates \
  -H "Content-Type: application/json" \
  -d '{
    "id": "CERT-003",
    "alumno": "Ana López",
    "carrera": "Ingeniería de Software",
    "fechaEmision": "2025-10-27",
    "issuer": "Universidad Nacional",
    "promedio": 92.5,
    "hashDoc": "c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789a"
  }'
```

#### 7.4 Verificar certificado
```bash
# Verificación exitosa (hash correcto)
curl -X POST http://localhost:3001/api/certificates/CERT-003/verify \
  -H "Content-Type: application/json" \
  -d '{"hashDoc": "c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789a"}'

# Verificación fallida (hash incorrecto)
curl -X POST http://localhost:3001/api/certificates/CERT-003/verify \
  -H "Content-Type: application/json" \
  -d '{"hashDoc": "hash_incorrecto"}'
```

#### 7.5 Revocar certificado
```bash
curl -X POST http://localhost:3001/api/certificates/CERT-003/revoke \
  -H "Content-Type: application/json" \
  -d '{"razon": "Certificado de prueba"}'

# Verificar que está revocado
curl http://localhost:3001/api/certificates/CERT-003
```

## 📚 Estructura del Proyecto

### Chaincode (Smart Contract)
- **Lenguaje**: TypeScript
- **Framework**: Hyperledger Fabric Contract API
- **Funciones**: issueCertificate, readCertificate, verifyCertificate, revokeCertificate

### API REST
- **Lenguaje**: TypeScript  
- **Framework**: Express.js
- **Características**: Tipado estricto, arquitectura modular, manejo de errores

### Red Blockchain
- **Plataforma**: Hyperledger Fabric 2.5.4
- **Organizaciones**: 2 (Org1, Org2)
- **Peers**: 1 por organización
- **Orderer**: Solo orderer service
- **Canal**: mychannel

## 🔧 Comandos Útiles

### Gestión de la Red
```bash
# Detener la red
./network.sh down

# Reiniciar la red
./network.sh up createChannel -ca

# Ver logs de un contenedor específico
docker logs peer0.org1.example.com
```

### Desarrollo de API
```bash
# Modo desarrollo con hot-reload
npm run dev

# Verificación de tipos
npm run typecheck

# Build para producción
npm run build && npm start
```

## ❌ Troubleshooting

### Si el chaincode no se instala:
1. Verificar que fabric-samples esté en la versión correcta
2. Limpiar contenedores: `docker system prune -f`
3. Reiniciar la red: `./network.sh down && ./network.sh up createChannel -ca`
4. Repetir el despliegue: `./scripts/deployCC.sh -ccn certificates -ccp ../../chaincode/certificates -ccl node -ccv 1.0 -ccs 1`

### Si la API no conecta con Fabric:
1. Verificar que la red esté corriendo: `docker ps`
2. Comprobar que el chaincode esté desplegado: `peer chaincode query -C mychannel -n certificates -c '{"Args":["readCertificate","CERT-001"]}'`
3. Revisar la configuración de paths en `api/src/config/index.ts`

## 🚀 Inicio Rápido (Resumen)

Para estudiantes que quieren ejecutar el proyecto rápidamente:

```bash
# 1. Limpiar Docker
docker stop $(docker ps -aq) && docker system prune -f

# 2. Clonar el proyecto (si no lo has hecho)
git clone <URL_DEL_REPOSITORIO>
cd ejercicio_registro_certificados

# 3. Descargar fabric-samples (OBLIGATORIO)
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
./install-fabric.sh --fabric-version 2.5.4 --ca-version 1.5.5 docker binary samples
rm install-fabric.sh

# 4. Levantar red blockchain
cd fabric-samples/test-network
./network.sh up createChannel -ca

# 5. Preparar chaincode
cd ../../chaincode/certificates
npm install && npm run build

# 6. Desplegar chaincode usando script automatizado
cd ../../fabric-samples/test-network
./scripts/deployCC.sh -ccn certificates -ccp ../../chaincode/certificates -ccl node -ccv 1.0 -ccs 1

# 7. Iniciar API
cd ../../api
npm install && npm run build && npm run dev
```

**⚠️ Importante**: fabric-samples NO está incluido en este repositorio y debe descargarse por separado.

## 🎓 Objetivos de Aprendizaje

Al completar este ejercicio, los estudiantes habrán aprendido:
- Desarrollo de smart contracts en TypeScript
- Despliegue y gestión de chaincodes en Hyperledger Fabric
- Creación de APIs REST que interactúan con blockchain
- Arquitectura de aplicaciones descentralizadas
- Gestión de identidades y certificados digitales
- Verificación criptográfica mediante hash
- Conceptos de inmutabilidad y trazabilidad

¡Felicitaciones por completar el ejercicio de certificados académicos con blockchain! 🎉