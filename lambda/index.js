const https = require('https');
const AWS = require('aws-sdk');

// Initialize DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE_NAME;

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

// Helper function to save image to DynamoDB
async function saveImageToDynamoDB(userId, dogData) {
    const timestamp = new Date().toISOString();
    const breed = extractBreedFromUrl(dogData.message);
    const item = {
        id: `${userId}-${Date.now()}`, // Unique ID combining user ID and timestamp
        user_id: userId,
        created_at: timestamp,
        image_url: dogData.message,
        status: dogData.status,
        breed: breed,
        description: dogData.description || `A beautiful ${breed} dog from the Dog API collection`
    };

    console.log('Saving image to DynamoDB:', {
        userId: userId,
        imageUrl: dogData.message,
        breed: item.breed,
        tableName: tableName
    });

    const params = {
        TableName: tableName,
        Item: item
    };

    try {
        console.log('DynamoDB put params:', JSON.stringify(params, null, 2));
        await dynamodb.put(params).promise();
        console.log('✅ Image saved to DynamoDB:', item.id);
        return item;
    } catch (error) {
        console.error('❌ Error saving to DynamoDB:', error);
        throw error;
    }
}

// Helper function to get saved images for a user
async function getSavedImages(userId, limit = 10) {
    const params = {
        TableName: tableName,
        IndexName: 'user-index',
        KeyConditionExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false, // Sort by created_at descending (newest first)
        Limit: limit
    };

    try {
        const result = await dynamodb.query(params).promise();
        console.log(`📸 Retrieved ${result.Items.length} saved images for user ${userId}`);
        return result.Items;
    } catch (error) {
        console.error('❌ Error retrieving saved images:', error);
        throw error;
    }
}

// Helper function to extract breed from image URL
function extractBreedFromUrl(url) {
    try {
        // Extract breed from URL like: https://images.dog.ceo/breeds/retriever-golden/n02099601_1004.jpg
        const match = url.match(/breeds\/([^\/]+)\//);
        return match ? match[1].replace(/-/g, ' ') : 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

// Helper function to delete image from DynamoDB
async function deleteImageFromDynamoDB(userId, imageUrl) {
    // First, find the image by querying the user-index
    const queryParams = {
        TableName: tableName,
        IndexName: 'user-index',
        KeyConditionExpression: 'user_id = :userId',
        FilterExpression: 'image_url = :imageUrl',
        ExpressionAttributeValues: {
            ':userId': userId,
            ':imageUrl': imageUrl
        }
    };

    try {
        const queryResult = await dynamodb.query(queryParams).promise();
        
        if (queryResult.Items.length === 0) {
            throw new Error('Image not found in saved collection');
        }

        // Delete the image using the primary key
        const deleteParams = {
            TableName: tableName,
            Key: {
                id: queryResult.Items[0].id,
                created_at: queryResult.Items[0].created_at
            }
        };

        await dynamodb.delete(deleteParams).promise();
        console.log('✅ Image deleted from DynamoDB:', queryResult.Items[0].id);
        return { success: true, deletedId: queryResult.Items[0].id };
    } catch (error) {
        console.error('❌ Error deleting from DynamoDB:', error);
        throw error;
    }
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
            case 'DELETE':
                response = await handleDeleteRequest(path, event, userInfo);
                break;
            case 'OPTIONS':
                response = {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                        'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
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
                        'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
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
        const userId = claims.sub || 'unknown';
        const queryParams = event.queryStringParameters || {};
        
        // Check if user wants to retrieve saved images
        if (queryParams.action === 'saved') {
            const limit = parseInt(queryParams.limit) || 10;
            const savedImages = await getSavedImages(userId, limit);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    message: 'Saved images retrieved successfully!',
                    timestamp: new Date().toISOString(),
                    path: path,
                    method: 'GET',
                    user: userId,
                    requestId: event.requestContext.requestId,
                    savedImages: savedImages,
                    count: savedImages.length
                })
            };
        }
        
        // Default behavior: get new random dog image (don't save automatically)
        const dogApiResponse = await makeHttpRequest('https://dog.ceo/api/breeds/image/random');
        
        const response = {
            message: 'Dog image fetched successfully!',
            timestamp: new Date().toISOString(),
            path: path,
            method: 'GET',
            user: userId,
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
        console.error('Error in GET request:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing GET request',
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
        const userId = claims.sub || 'unknown';
        
        // Debug logging
        console.log('POST request body:', JSON.stringify(body));
        console.log('Body action:', body.action);
        console.log('Body imageUrl:', body.imageUrl);
        
        // Check if this is a save image request
        if (body.action === 'save_image' && body.imageUrl) {
            console.log('✅ Processing save_image request for user:', userId);
            const dogData = {
                message: body.imageUrl,
                status: 'success'
            };
            
            // Save the specific image to DynamoDB
            const savedImage = await saveImageToDynamoDB(userId, dogData);
            
            console.log('✅ Save image completed, returning response');
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    message: 'Image saved successfully!',
                    timestamp: new Date().toISOString(),
                    user: userId,
                    requestId: event.requestContext.requestId,
                    savedImage: savedImage
                })
            };
        }
        
        console.log('⚠️ Not a save_image request, proceeding with default POST behavior');
        
        // Default behavior: get a random dog image for POST requests
        const dogApiResponse = await makeHttpRequest('https://dog.ceo/api/breeds/image/random');
        
        // Save the image to DynamoDB
        const savedImage = await saveImageToDynamoDB(userId, dogApiResponse);
        
        const response = {
            message: 'Data received and dog image fetched and saved!',
            timestamp: new Date().toISOString(),
            path: path,
            method: 'POST',
            user: userId,
            requestId: event.requestContext.requestId,
            receivedData: body,
            dogData: dogApiResponse,
            savedImage: savedImage
        };
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Error in POST request:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing POST request',
                error: error.message
            })
        };
    }
}

async function handleDeleteRequest(path, event, claims) {
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        body = event.body;
    }
    
    try {
        const userId = claims.sub || 'unknown';
        
        // Check if this is a delete image request
        if (body.action === 'delete_image' && body.imageUrl) {
            const deleteResult = await deleteImageFromDynamoDB(userId, body.imageUrl);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    message: 'Image deleted successfully!',
                    timestamp: new Date().toISOString(),
                    user: userId,
                    requestId: event.requestContext.requestId,
                    deleteResult: deleteResult
                })
            };
        }
        
        // Default behavior for DELETE requests
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Invalid DELETE request. Expected action: delete_image and imageUrl'
            })
        };
    } catch (error) {
        console.error('Error in DELETE request:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error processing DELETE request',
                error: error.message
            })
        };
    }
}
