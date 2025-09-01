# AWS Website Hosting with Cognito Authentication and Lambda API

A complete, production-ready solution for hosting a React.js application on AWS using CloudFront, Cognito for user authentication, S3 for static website hosting, and Lambda for serverless API functionality. 

## 🔒 **Security Focus: Cognito Protecting Both Frontend and Backend**

This project demonstrates **Cognito securing both the website and backend API** by preventing unauthorized users from accessing protected resources. It's designed as a **security testing and demonstration platform** to show how Cognito can protect your entire application stack.

**Perfect for:**
- 🔐 **Security Engineers** testing authentication flows
- 🧪 **Developers** learning Cognito integration patterns
- 🏢 **Architects** designing secure application architectures
- 📚 **Students** understanding AWS security best practices

The key security features include:

### **Frontend Protection:**
- **Authentication Required**: Users must sign in through Cognito before accessing the main application
- **Protected Routes**: React app content is only visible after successful authentication
- **Session Management**: Automatic token refresh and secure session handling

### **Backend Protection:**
- **Lambda API Security**: All Lambda endpoints require valid Cognito authentication tokens
- **No Direct Access**: Unauthenticated users cannot reach the Lambda function directly
- **Token Validation**: Every API request is validated against Cognito before processing
- **Secure Communication**: All API calls use authenticated headers and tokens

### **Security Architecture:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   CloudFront     │    │   S3 Bucket     │
│   (Protected)   │◄──►│   (CDN)          │◄──►│   (Hosting)     │
│   Auth Required │    │   (Public)       │    │   (Public)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cognito       │    │   Lambda         │    │   Dog API       │
│   (Auth)        │    │   (Protected)    │    │   (External)    │
│                 │    │   Auth Required  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Key Security Benefits:**
- ✅ **Frontend Protection**: Website content only accessible to authenticated users
- ✅ **Backend Protection**: API endpoints completely secured behind Cognito
- ✅ **No Anonymous Access**: Both frontend and backend require valid authentication
- ✅ **Token-Based Security**: JWT tokens ensure secure, stateless authentication
- ✅ **Automatic Expiration**: Tokens automatically expire for enhanced security

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   CloudFront     │    │   S3 Bucket     │
│   (Frontend)    │◄──►│   (CDN)          │◄──►│   (Hosting)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cognito       │    │   Lambda         │    │   Dog API       │
│   (Auth)        │    │   (API)          │    │   (External)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

- **Frontend**: React.js application with AWS Amplify authentication
- **CDN**: CloudFront distribution for global content delivery
- **Hosting**: S3 bucket with versioning and public access blocking
- **Authentication**: Cognito User Pool and Identity Pool
- **Backend**: Lambda function with authenticated API endpoints
- **External Integration**: Dog API for dynamic image content
- **Infrastructure**: OpenTofu for complete automation

## 🚀 Quick Start

Get your AWS-hosted React app with Cognito authentication up and running in minutes using OpenTofu!

### Prerequisites Check

First, ensure you have the required tools installed:

```bash
# Check AWS CLI
aws --version

# Check OpenTofu
tofu --version

# Check Node.js
node --version

# Check npm
npm --version
```

### One-Command Deployment

The easiest way to deploy everything:

```bash
# Initialize OpenTofu
tofu init

# Plan the deployment
tofu plan

# Apply and deploy everything automatically
tofu apply -auto-approve
```

That's it! OpenTofu will automatically:
1. ✅ Deploy all AWS infrastructure
2. 📦 Build the React app
3. 🗜️ Package the Lambda function
4. 🔧 Update React configuration with real values
5. 📤 Upload the app to S3
6. 🔄 Invalidate CloudFront cache
7. 📊 Show you all the important URLs and IDs

### Manual Deployment (Step by Step)

If you prefer to deploy manually:

1. **Initialize OpenTofu**
   ```bash
   tofu init
   ```

2. **Plan the Deployment**
   ```bash
   tofu plan
   ```

3. **Deploy Everything**
   ```bash
   tofu apply -auto-approve
   ```

OpenTofu will handle all the automation automatically!

## 🏠 Local Development Setup

### Environment Variables
After running `tofu apply`, a `.env` file will be created automatically. This file contains your AWS credentials for local development.

**⚠️ Important**: The `.env` file is automatically added to `.gitignore` to prevent committing sensitive information.

### Start Local Development Server
```bash
cd src
npm install
npm start
```

The React app will now use your local `.env` file for configuration.

### Test Locally
- Open http://localhost:3000
- Sign up/sign in with Cognito
- Test API calls to your deployed Lambda function
- View dog images in the gallery

## 🧪 Testing Your Deployment

### 1. Visit Your Website
Navigate to the CloudFront URL shown in the OpenTofu outputs.

### 2. Create a User Account
- Click "Create Account"
- Enter your email and password
- Check your email for verification code
- Verify your account

### 3. Sign In
- Use your credentials to sign in
- You should see your user information displayed

### 4. Test the API and Dog Images
- Use the test buttons to make authenticated API calls
- Verify that API calls return successful responses with dog data
- Check that dog images appear in the gallery
- Verify that each API call fetches a new random dog image

## 🔍 Verify Everything is Working

### Check S3 Bucket
```bash
aws s3 ls s3://$(tofu output -raw s3_bucket_name)
```

### Check CloudFront Distribution
```bash
aws cloudfront get-distribution --id $(tofu output -raw cloudfront_distribution_id)
```

### Check Lambda Function
```bash
aws lambda get-function --function-name $(tofu output -raw lambda_function_name)
```

### Check Cognito User Pool
```bash
aws cognito-idp describe-user-pool --user-pool-id $(tofu output -raw cognito_user_pool_id)
```

### Test Dog API Directly
```bash
curl https://dog.ceo/api/breeds/image/random
```

### 🧪 **Test API Gateway with JWT Authentication**

For advanced testing and debugging, use the included test script to verify your API Gateway endpoint works correctly with JWT authentication:

#### **Prerequisites**
- Node.js installed on your system
- A valid JWT token from your authenticated session

#### **Get Your JWT Token**
1. Sign in to your React app at the CloudFront URL
2. Open browser console (F12 → Console)
3. Run these commands:
   ```javascript
   const user = await getCurrentUser();
   const session = await fetchAuthSession();
   console.log(session.tokens.idToken.toString());
   ```
4. Copy the entire JWT token (starts with `eyJ...`)

#### **Run the Test Script**
```bash
# Test with your JWT token
node test-api-gateway.js <YOUR_JWT_TOKEN>

# Example:
node test-api-gateway.js eyJraWQiOiJUR1RJbkJYTGVVelVGNmRVRHk4UFI0MjRlM0JPNmthdXFYd2E0QjNCVkhVPSIsImFsZyI6IlJTMjU2In0...
```

#### **What the Test Script Does**
- ✅ **GET Request**: Tests authenticated GET endpoint
- ✅ **POST Request**: Tests authenticated POST endpoint  
- ✅ **JWT Validation**: Verifies your token is accepted
- ✅ **Response Analysis**: Shows detailed response data
- ✅ **Error Handling**: Provides clear error messages

#### **Expected Results**
- **HTTP 200**: Success with dog image data
- **HTTP 401**: Invalid or expired JWT token
- **HTTP 403**: JWT token missing or malformed

#### **Troubleshooting with Test Script**
```bash
# Test without token (should fail)
node test-api-gateway.js

# Test with invalid token (should fail)
node test-api-gateway.js invalid-token

# Test with valid token (should succeed)
node test-api-gateway.js eyJraWQiOiJUR1RJbkJYTGVVelVGNmRVRHk4UFI0MjRlM0JPNmthdXFYd2E0QjNCVkhVPSIsImFsZyI6IlJTMjU2In0...
```

### 🔒 **Test Security Features**

This project is designed to demonstrate security. Try these tests to verify protection:

#### **Frontend Security Tests:**
1. **Unauthenticated Access**: Visit the website without logging in
   - ✅ **Expected**: Only authentication forms visible, no protected content
   - ❌ **If you see protected content**: Security is compromised

2. **Authentication Flow**: Complete the sign-up and sign-in process
   - ✅ **Expected**: Access to main application content after authentication
   - ❌ **If authentication fails**: Check Cognito configuration

#### **Backend Security Tests:**
1. **Direct Lambda Access (Unauthenticated)**:
   ```bash
   # This should fail with 401 Unauthorized
   curl https://your-lambda-url.lambda-url.region.on.aws/test
   ```
   - ✅ **Expected**: 401 Unauthorized response
   - ❌ **If you get data**: Backend security is compromised

2. **Authenticated Lambda Access**:
   - ✅ **Expected**: Successfully call Lambda endpoints after logging into the website
   - ❌ **If calls fail**: Check JWT token handling

#### **Infrastructure Security Tests:**
1. **Direct S3 Access**:
   ```bash
   # This should fail with Access Denied
   curl https://your-bucket.s3.amazonaws.com/index.html
   ```
   - ✅ **Expected**: Access Denied error
   - ❌ **If you get the file**: S3 security is compromised

2. **CloudFront Security**:
   - ✅ **Expected**: HTTPS enforced, security headers present
   - ❌ **If HTTP works or headers missing**: CloudFront security needs review

## 🚨 Common Issues & Solutions

### Issue: "Access Denied" when accessing S3
**Solution**: Wait for CloudFront distribution to deploy (can take 10-15 minutes)

### Issue: Cognito authentication fails
**Solution**: Verify the configuration values in your `.env` file match OpenTofu outputs

### Issue: Lambda function returns 401
**Solution**: Ensure you're signed in and the JWT token is being sent correctly

### Issue: CORS errors
**Solution**: Check that the Lambda function URL is correctly configured in your `.env` file

### Issue: Missing environment variables error
**Solution**: Run `tofu apply -auto-approve` to generate the `.env` file automatically

### Issue: Dog images not loading
**Solution**: Check Lambda logs for Dog API call failures, verify internet connectivity from Lambda

## 🔐 Authentication Flow

1. **User Registration**: Users sign up through Cognito
2. **Email Verification**: Cognito sends verification emails
3. **User Sign-in**: Users authenticate with Cognito
4. **Token Generation**: Cognito provides JWT tokens
5. **API Calls**: Lambda function validates JWT tokens
6. **External API Integration**: Lambda calls Dog API for images
7. **Authorized Access**: Users can access protected resources and view dog images

## 🛡️ **Comprehensive Security Implementation**

### **Frontend Security (React App)**
- **Route Protection**: All main application content is wrapped in authentication guards
- **Conditional Rendering**: UI elements only appear after successful Cognito authentication
- **Token Storage**: JWT tokens are securely stored and managed by AWS Amplify
- **Session Persistence**: Authentication state persists across browser sessions
- **Automatic Logout**: Tokens expire automatically, forcing re-authentication

### **Backend Security (Lambda API)**
- **JWT Validation**: Every API request validates Cognito JWT tokens
- **No Anonymous Access**: Unauthenticated requests receive 401 Unauthorized responses
- **Token Verification**: Lambda verifies token signature, expiration, and issuer
- **User Context**: Authenticated requests include verified user information
- **Secure Headers**: All API responses include proper security headers

### **Infrastructure Security**
- **S3 Bucket Security**: Private bucket with CloudFront-only access through Origin Access Control
- **CloudFront Security**: HTTPS enforcement, security headers, and access logging
- **Cognito Security**: Multi-factor authentication support, password policies, and user pool security
- **Lambda Security**: IAM roles with least privilege, VPC isolation, and execution logging
- **Network Security**: All communication encrypted in transit, no public direct access

### **Security Testing Scenarios**
This project demonstrates protection against:
- ✅ **Unauthenticated Frontend Access**: Users cannot see protected content without login
- ✅ **Unauthenticated API Access**: Direct Lambda calls without tokens are rejected
- ✅ **Token Tampering**: Invalid or expired tokens are rejected
- ✅ **Direct S3 Access**: Bucket is private and only accessible through CloudFront
- ✅ **Man-in-the-Middle**: All traffic encrypted with HTTPS
- ✅ **Session Hijacking**: JWT tokens are validated and expire automatically

## 📡 API Endpoints

The Lambda function provides the following REST endpoints, each returning a random dog image:

- **GET** `/test` - Retrieve data with dog image (requires authentication)
- **POST** `/test` - Create data with dog image (requires authentication)
- **PUT** `/test` - Update data with dog image (requires authentication)
- **DELETE** `/test` - Delete data with dog image (requires authentication)

All endpoints require valid Cognito JWT tokens for authentication and integrate with the [Dog API](https://dog.ceo/dog-api/) to fetch random dog images.

## 🐕 Dog API Integration

The Lambda function integrates with the [Dog CEO API](https://dog.ceo/dog-api/) to provide:

- **Random Dog Images**: Each API call fetches a new random dog image
- **Breed Information**: Extracts breed information from image URLs
- **Image Gallery**: Frontend displays up to 10 recent dog images
- **Real-time Updates**: New images are added to the gallery with each API call

### Dog API Features
- **Endpoint**: `https://dog.ceo/api/breeds/image/random`
- **Response Format**: JSON with image URL and status
- **Image Source**: Curated collection of open-source dog pictures
- **No API Key Required**: Free to use with no authentication needed

## 🖼️ Frontend Image Gallery

The React application includes a dynamic image gallery that:

- **Displays Dog Images**: Shows fetched dog images in a responsive grid
- **Breed Information**: Extracts and displays breed names from URLs
- **Request Metadata**: Shows HTTP method and timestamp for each image
- **Interactive Controls**: Clear gallery button and hover effects
- **Responsive Design**: Adapts to different screen sizes
- **Error Handling**: Graceful fallbacks for failed image loads

## 🔒 Security Features

- **S3 Security**: Private bucket with CloudFront-only access
- **Authentication**: Cognito handles user management and session tokens
- **Authorization**: Lambda validates JWT tokens for all API calls
- **HTTPS**: CloudFront enforces HTTPS for all traffic
- **CORS**: Properly configured for web application access
- **IAM**: Least privilege access policies
- **Environment Variables**: Sensitive data stored in `.env` files (gitignored)

## 📊 Monitoring and Logging

### Logging Locations
- **CloudWatch Logs**: Lambda function execution logs
- **CloudFront Access Logs**: Website access patterns
- **Cognito User Pool**: Authentication events
- **S3 Access Logs**: Object access patterns

### Monitoring Points
- Lambda function execution and errors
- CloudFront distribution performance
- Cognito user sign-ups and sign-ins
- S3 bucket access and usage

## 🧹 Cleanup

To remove all resources:

```bash
tofu destroy -auto-approve
```

**Warning**: This will permanently delete all resources created by this project.

## 📁 Project Structure

```
aws-website-hosting-user-auth-cognito/
├── 📄 README.md                    # This comprehensive documentation
├── 📄 package.json                 # Root project configuration and scripts
├── 📄 .gitignore                   # Git ignore patterns
├── 📄 env.example                  # Example environment file template
├── 📁 src/                         # React application
│   ├── 📄 package.json            # React app dependencies
│   ├── 📄 public/index.html       # HTML template
│   ├── 📄 src/index.js            # React entry point
│   ├── 📄 src/index.css           # Global styles
│   └── 📄 src/App.js              # Main React component
├── 📁 lambda/                      # Lambda function
│   └── 📄 index.js                # Lambda handler with Dog API integration
├── 📄 test-api-gateway.js         # Test script for API Gateway with JWT authentication
└── 📁 terraform/                   # Infrastructure as Code
    ├── 📄 provider.tf             # AWS provider configuration
    ├── 📄 locals.tf               # Common variables and tags
    ├── 📄 cognito.tf              # Cognito User Pool and Identity Pool
    ├── 📄 s3.tf                   # S3 bucket configuration
    ├── 📄 cloudfront.tf           # CloudFront distribution
    ├── 📄 lambda.tf               # Lambda function and IAM roles
    ├── 📄 automation.tf           # Complete automation via local-exec
    └── 📄 outputs.tf              # Output values
```

## 🔄 Development Workflow

### Typical Development Cycle
1. **Code Changes**: Modify React app or Lambda function
2. **Local Testing**: Test changes locally with `npm start`
3. **Deploy**: Run `tofu apply -auto-approve` to deploy everything automatically
4. **Test**: Verify changes in production environment

### Environment Management
- **Development**: Local React development server
- **Production**: Live AWS environment managed by OpenTofu

## 🎯 Key Benefits of This Approach

- **No external scripts** - Everything is managed by OpenTofu
- **Fully automated** - From infrastructure to application deployment
- **Idempotent** - Safe to run multiple times
- **Self-contained** - All logic is in the Terraform configuration
- **Clean** - No lingering executables or temporary files
- **Secure** - Environment variables automatically gitignored
- **Scalable** - CloudFront CDN and serverless architecture

## 🆘 Troubleshooting

### Authentication Issues
- Verify Cognito configuration in `.env` file
- Check CloudWatch logs for Lambda errors
- Ensure user account is verified

### Deployment Issues
- Check OpenTofu outputs for resource IDs
- Verify AWS credentials and permissions
- Wait for CloudFront distribution to fully deploy

### Performance Issues
- Monitor CloudFront metrics
- Check S3 access patterns
- Review Lambda execution logs

## 📚 Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS Cognito Developer Guide](https://docs.aws.amazon.com/cognito/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [OpenTofu Documentation](https://opentofu.org/docs)
- [React Documentation](https://reactjs.org/docs/)
- [Dog CEO API](https://dog.ceo/dog-api/)

---

**Happy deploying! 🎉**

This project demonstrates a complete, production-ready setup for hosting a React application on AWS with authentication, serverless backend capabilities, and external API integration - all managed through OpenTofu infrastructure as code.
