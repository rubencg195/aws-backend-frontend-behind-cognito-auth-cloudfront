const https = require('https');

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
    console.log('🔍 Event structure:', JSON.stringify(event, null, 2));
    
    // Extract user information from API Gateway context (set by Cognito Authorizer)
    const userInfo = event.requestContext?.authorizer?.claims || {};
    console.log('👤 Authenticated user:', userInfo.sub || 'unknown');
    console.log('📧 User email:', userInfo.email || 'unknown');
    console.log('🔍 Full userInfo:', JSON.stringify(userInfo, null, 2));
    
    const method = event.httpMethod;
    const path = event.path;
    
    console.log(`Handling ${method} request to ${path}`);
    
    try {
        let response;
        
        switch (method) {
            case 'GET':
                response = await handleGetRequest(path, event, userInfo);
                break;
            case 'POST':
                response = await handlePostRequest(path, event, userInfo);
                break;
            case 'OPTIONS':
                response = {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message
            })
        };
    }
}
