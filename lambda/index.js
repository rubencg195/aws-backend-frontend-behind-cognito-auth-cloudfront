const https = require('https');
const jwt = require('jsonwebtoken');

// Cognito User Pool configuration
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_hXWpScSIF';
const REGION = process.env.REGION || 'us-east-1';

// Get Cognito public keys for JWT validation
async function getCognitoPublicKeys() {
    const url = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;
    
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.keys);
                } catch (error) {
                    reject(new Error('Invalid JSON response from Cognito'));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Validate Cognito JWT token
async function validateCognitoToken(token) {
    try {
        console.log('🔍 Starting JWT validation...');
        console.log('🔍 Token received:', token ? `${token.substring(0, 50)}...` : 'null');
        
        if (!token) {
            console.log('❌ No token provided');
            return { valid: false, error: 'No token provided' };
        }

        // Remove 'Bearer ' prefix if present
        const actualToken = token.startsWith('Bearer ') ? token.substring(7) : token;
        console.log('🔍 Token after Bearer removal:', actualToken ? `${actualToken.substring(0, 50)}...` : 'null');
        
        // Decode the token header to get the key ID
        const decodedHeader = jwt.decode(actualToken, { complete: true });
        if (!decodedHeader) {
            console.log('❌ Invalid token format - could not decode header');
            return { valid: false, error: 'Invalid token format' };
        }

        console.log('🔍 Token header decoded successfully');
        console.log('🔍 Key ID (kid):', decodedHeader.header.kid);
        console.log('🔍 Algorithm:', decodedHeader.header.alg);
        console.log('🔍 Token type:', decodedHeader.header.typ);
        
        const keyId = decodedHeader.header.kid;
        
        // Get Cognito public keys
        console.log('🔍 Fetching Cognito public keys...');
        const publicKeys = await getCognitoPublicKeys();
        console.log('🔍 Public keys fetched, count:', publicKeys.length);
        
        const publicKey = publicKeys.find(key => key.kid === keyId);
        if (!publicKey) {
            console.log('❌ Public key not found for kid:', keyId);
            console.log('🔍 Available keys:', publicKeys.map(k => k.kid));
            return { valid: false, error: 'Public key not found' };
        }

        console.log('🔍 Public key found for kid:', keyId);
        
        // Convert JWK to PEM format
        const pem = jwkToPem(publicKey);
        console.log('🔍 JWK converted to PEM format');
        
        // Verify the token
        console.log('🔍 Verifying token with Cognito...');
        console.log('🔍 Expected issuer:', `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`);
        console.log('🔍 Expected audience:', process.env.COGNITO_CLIENT_ID || '6muhghfqcrncf8p219tmikfp96');
        
        const decoded = jwt.verify(actualToken, pem, {
            algorithms: ['RS256'],
            issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
            audience: process.env.COGNITO_CLIENT_ID || '6muhghfqcrncf8p219tmikfp96'
        });

        console.log('✅ Token verified successfully!');
        console.log('✅ User ID (sub):', decoded.sub);
        console.log('✅ Token issuer:', decoded.iss);
        console.log('✅ Token audience:', decoded.aud);
        console.log('✅ Token expiration:', new Date(decoded.exp * 1000).toISOString());
        
        return { valid: true, claims: decoded };
    } catch (error) {
        console.log('❌ JWT validation error:', error.message);
        console.log('❌ Error stack:', error.stack);
        return { valid: false, error: error.message };
    }
}

// Convert JWK to PEM format
function jwkToPem(jwk) {
    const { n, e } = jwk;
    
    // Convert base64url to base64
    const nBase64 = n.replace(/-/g, '+').replace(/_/g, '/');
    const eBase64 = e.replace(/-/g, '+').replace(/_/g, '/');
    
    // Convert to Buffer
    const nBuffer = Buffer.from(nBase64, 'base64');
    const eBuffer = Buffer.from(eBase64, 'base64');
    
    // Create PEM format
    const modulus = nBuffer.toString('base64').match(/.{1,64}/g).join('\n');
    const exponent = eBuffer.toString('base64');
    
    return `-----BEGIN PUBLIC KEY-----\n${modulus}\n-----END PUBLIC KEY-----`;
}

// Helper function to make HTTP requests
function makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

exports.handler = async (event) => {
    console.log('🚀 Lambda function invoked');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🔍 HTTP Method:', event.httpMethod);
    console.log('🔍 Path:', event.path);
    console.log('🔍 Request ID:', event.requestContext?.requestId);
    console.log('🔍 Full event structure:', JSON.stringify(event, null, 2));
    
    // Log all headers for debugging
    console.log('📋 All headers received:');
    Object.entries(event.headers || {}).forEach(([key, value]) => {
        if (key.toLowerCase() === 'authorization') {
            console.log(`  ${key}: ${value ? `${value.substring(0, 50)}...` : 'null'}`);
        } else {
            console.log(`  ${key}: ${value}`);
        }
    });
    
    // Extract Authorization header (case-insensitive)
    const authHeader = event.headers?.authorization || event.headers?.Authorization || event.headers?.AUTHORIZATION;
    console.log('🔐 Authorization header found:', authHeader ? 'YES' : 'NO');
    console.log('🔐 Authorization header type:', typeof authHeader);
    console.log('🔐 Authorization header length:', authHeader?.length || 0);
    
    if (authHeader) {
        console.log('🔐 Authorization header preview:', authHeader.substring(0, 100));
        console.log('🔐 Starts with Bearer:', authHeader.startsWith('Bearer '));
    }
    
    // For debugging, let's try to handle the request even without JWT validation first
    console.log('🔍 Bypassing JWT validation for debugging...');
    
    const method = event.httpMethod;
    const path = event.path;
    
    console.log(`Handling ${method} request to ${path}`);
    
    try {
        let response;
        
        switch (method) {
            case 'GET':
                response = await handleGetRequest(path, event, { sub: 'debug-user' });
                break;
            case 'POST':
                response = await handlePostRequest(path, event, { sub: 'debug-user' });
                break;
            case 'PUT':
                response = await handlePutRequest(path, event, { sub: 'debug-user' });
                break;
            case 'DELETE':
                response = await handleDeleteRequest(path, event, { sub: 'debug-user' });
                break;
            case 'OPTIONS':
                response = {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                    },
                    body: ''
                };
                break;
            default:
                response = {
                    statusCode: 405,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                    },
                    body: JSON.stringify({
                        message: 'Method not allowed'
                    })
                };
        }
        
        return response;
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};

async function handleGetRequest(path, event, claims) {
    try {
        // Call the Dog API to get a random dog image
        const dogApiResponse = await makeHttpRequest('https://dog.ceo/api/breeds/image/random');
        
        const response = {
            message: 'Dog image fetched successfully!',
            timestamp: new Date().toISOString(),
            path: path,
            method: 'GET',
            user: claims.sub || 'unknown',
            requestId: event.requestContext.requestId,
            dogData: dogApiResponse
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Error calling Dog API:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error fetching dog image',
                error: error.message
            })
        };
    }
}

async function handlePostRequest(path, event, claims) {
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        body = event.body;
    }
    
    try {
        // Get a random dog image for POST requests too
        const dogApiResponse = await makeHttpRequest('https://dog.ceo/api/breeds/image/random');
        
        const response = {
            message: 'Data received and dog image fetched!',
            timestamp: new Date().toISOString(),
            path: path,
            method: 'POST',
            user: claims.sub || 'unknown',
            requestId: event.requestContext.requestId,
            receivedData: body,
            dogData: dogApiResponse
        };
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Error calling Dog API:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message
            })
        };
    }
}

async function handlePutRequest(path, event, claims) {
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        body = event.body;
    }
    
    try {
        // Get a random dog image for PUT requests too
        const dogApiResponse = await makeHttpRequest('https://dog.ceo/api/breeds/image/random');
        
        const response = {
            message: 'Data updated and dog image fetched!',
            timestamp: new Date().toISOString(),
            path: path,
            method: 'PUT',
            user: claims.sub || 'unknown',
            requestId: event.requestContext.requestId,
            updatedData: body,
            dogData: dogApiResponse
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Error calling Dog API:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message
            })
        };
    }
}

async function handleDeleteRequest(path, event, claims) {
    try {
        // Get a random dog image for DELETE requests too
        const dogApiResponse = await makeHttpRequest('https://dog.ceo/api/breeds/image/random');
        
        const response = {
            message: 'Data deleted and dog image fetched!',
            timestamp: new Date().toISOString(),
            path: path,
            method: 'DELETE',
            user: claims.sub || 'unknown',
            requestId: event.requestContext.requestId,
            dogData: dogApiResponse
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Error calling Dog API:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message
            })
        };
    }
}
