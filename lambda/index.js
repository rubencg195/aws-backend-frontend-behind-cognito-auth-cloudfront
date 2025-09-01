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
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Check if the request is authenticated
    if (!event.requestContext || !event.requestContext.authorizer) {
        return {
            statusCode: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Unauthorized - Authentication required'
            })
        };
    }
    
    const method = event.httpMethod;
    const path = event.path;
    
    console.log(`Handling ${method} request to ${path}`);
    
    try {
        let response;
        
        switch (method) {
            case 'GET':
                response = await handleGetRequest(path, event);
                break;
            case 'POST':
                response = await handlePostRequest(path, event);
                break;
            case 'PUT':
                response = await handlePutRequest(path, event);
                break;
            case 'DELETE':
                response = await handleDeleteRequest(path, event);
                break;
            case 'OPTIONS':
                response = {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};

async function handleGetRequest(path, event) {
    try {
        // Call the Dog API to get a random dog image
        const dogApiResponse = await makeHttpRequest('https://dog.ceo/api/breeds/image/random');
        
        const response = {
            message: 'Dog image fetched successfully!',
            timestamp: new Date().toISOString(),
            path: path,
            method: 'GET',
            user: event.requestContext.authorizer.claims?.sub || 'unknown',
            requestId: event.requestContext.requestId,
            dogData: dogApiResponse
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error fetching dog image',
                error: error.message
            })
        };
    }
}

async function handlePostRequest(path, event) {
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
            user: event.requestContext.authorizer.claims?.sub || 'unknown',
            requestId: event.requestContext.requestId,
            receivedData: body,
            dogData: dogApiResponse
        };
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message
            })
        };
    }
}

async function handlePutRequest(path, event) {
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
            user: event.requestContext.authorizer.claims?.sub || 'unknown',
            requestId: event.requestContext.requestId,
            updatedData: body,
            dogData: dogApiResponse
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message
            })
        };
    }
}

async function handleDeleteRequest(path, event) {
    try {
        // Get a random dog image for DELETE requests too
        const dogApiResponse = await makeHttpRequest('https://dog.ceo/api/breeds/image/random');
        
        const response = {
            message: 'Data deleted and dog image fetched!',
            timestamp: new Date().toISOString(),
            path: path,
            method: 'DELETE',
            user: event.requestContext.authorizer.claims?.sub || 'unknown',
            requestId: event.requestContext.requestId,
            dogData: dogApiResponse
        };
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message
            })
        };
    }
}
