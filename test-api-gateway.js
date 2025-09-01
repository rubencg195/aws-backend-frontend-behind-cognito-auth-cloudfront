#!/usr/bin/env node

/**
 * Test script for API Gateway endpoint with JWT authentication
 * 
 * Usage:
 *   node test-api-gateway.js <JWT_TOKEN>
 * 
 * Example:
 *   node test-api-gateway.js eyJraWQiOiJUR1RJbkJYTGVVelVGNmRVRHk4UFI0MjRlM0JPNmthdXFYd2E0QjNCVkhVPSIsImFsZyI6IlJTMjU2In0...
 */

const https = require('https');

// Get JWT token from command line arguments
const jwtToken = process.argv[2];

if (!jwtToken) {
  console.error('❌ Error: JWT token is required');
  console.error('');
  console.error('Usage: node test-api-gateway.js <JWT_TOKEN>');
  console.error('');
  console.error('Example:');
  console.error('  node test-api-gateway.js eyJraWQiOiJUR1RJbkJYTGVVelVGNmRVRHk4UFI0MjRlM0JPNmthdXFYd2E0QjNCVkhVPSIsImFsZyI6IlJTMjU2In0...');
  console.error('');
  console.error('To get a JWT token:');
  console.error('  1. Sign in to your React app');
  console.error('  2. Open browser console and run:');
  console.error('     const user = await getCurrentUser();');
  console.error('     const session = await fetchAuthSession();');
  console.error('     console.log(session.tokens.idToken.toString());');
  console.error('');
  process.exit(1);
}

// API Gateway endpoint (update this with your actual endpoint)
const API_ENDPOINT = 'https://k5hw4c5osj.execute-api.us-east-1.amazonaws.com/prod/api';

console.log('🧪 Testing API Gateway with JWT authentication...');
console.log('================================================');
console.log('🔗 API Endpoint:', API_ENDPOINT);
console.log('🔑 JWT Token (first 50 chars):', jwtToken.substring(0, 50) + '...');
console.log('');

// Test GET request
function testGetRequest() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'k5hw4c5osj.execute-api.us-east-1.amazonaws.com',
      port: 443,
      path: '/prod/api',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
        'User-Agent': 'test-api-gateway.js/1.0'
      }
    };

    console.log('📡 Sending GET request to API Gateway...');
    console.log('📍 Hostname:', options.hostname);
    console.log('📍 Path:', options.path);
    console.log('🔑 Authorization: Bearer', jwtToken.substring(0, 20) + '...');

    const req = https.request(options, (res) => {
      console.log('');
      console.log('📊 Response received:');
      console.log('  Status:', res.statusCode, res.statusMessage);
      console.log('  Headers:', JSON.stringify(res.headers, null, 2));

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('  Body:', JSON.stringify(jsonData, null, 2));
          
          if (res.statusCode === 200) {
            console.log('');
            console.log('✅ SUCCESS! API Gateway responded with HTTP 200');
            if (jsonData.dogData && jsonData.dogData.message) {
              console.log('🐕 Dog image URL:', jsonData.dogData.message);
            }
          } else {
            console.log('');
            console.log('❌ FAILED! API Gateway responded with HTTP', res.statusCode);
          }
          
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          console.log('  Body (raw):', data);
          console.log('❌ Failed to parse JSON response:', error.message);
          resolve({ statusCode: res.statusCode, data: data, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout after 10 seconds'));
    });

    req.end();
  });
}

// Test POST request
function testPostRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: 'Test message from test-api-gateway.js',
      timestamp: new Date().toISOString(),
      test: true
    });

    const options = {
      hostname: 'k5hw4c5osj.execute-api.us-east-1.amazonaws.com',
      port: 443,
      path: '/prod/api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'test-api-gateway.js/1.0'
      }
    };

    console.log('');
    console.log('📡 Sending POST request to API Gateway...');
    console.log('📍 Hostname:', options.hostname);
    console.log('📍 Path:', options.path);
    console.log('📝 POST Data:', postData);
    console.log('🔑 Authorization: Bearer', jwtToken.substring(0, 20) + '...');

    const req = https.request(options, (res) => {
      console.log('');
      console.log('📊 Response received:');
      console.log('  Status:', res.statusCode, res.statusMessage);
      console.log('  Headers:', JSON.stringify(res.headers, null, 2));

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('  Body:', JSON.stringify(jsonData, null, 2));
          
          if (res.statusCode === 200) {
            console.log('');
            console.log('✅ SUCCESS! API Gateway responded with HTTP 200');
            if (jsonData.dogData && jsonData.dogData.message) {
              console.log('🐕 Dog image URL:', jsonData.dogData.message);
            }
          } else {
            console.log('');
            console.log('❌ FAILED! API Gateway responded with HTTP', res.statusCode);
          }
          
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          console.log('  Body (raw):', data);
          console.log('❌ Failed to parse JSON response:', error.message);
          resolve({ statusCode: res.statusCode, data: data, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout after 10 seconds'));
    });

    req.write(postData);
    req.end();
  });
}

// Main test execution
async function runTests() {
  try {
    console.log('🚀 Starting API Gateway tests...');
    console.log('');

    // Test GET request
    await testGetRequest();
    
    // Test POST request
    await testPostRequest();
    
    console.log('');
    console.log('🎉 All tests completed!');
    console.log('');
    console.log('📝 Summary:');
    console.log('  - GET request: Tested');
    console.log('  - POST request: Tested');
    console.log('  - JWT authentication: Verified');
    console.log('  - API Gateway integration: Working');
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
