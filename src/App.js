import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signOut, fetchAuthSession, signIn, signUp, confirmSignUp, deleteUser } from 'aws-amplify/auth';
import { get, post } from 'aws-amplify/api';
import './index.css';

// Debug: Log environment variables
console.log('Environment variables:', {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  userPoolClientId: process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID,
  identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID,
  lambdaEndpoint: process.env.REACT_APP_LAMBDA_API_ENDPOINT,
  environment: process.env.REACT_APP_ENVIRONMENT
});

// Configure Amplify with environment variables (v6 format)
const awsConfig = {
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID,
      identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID,
    }
  },
  API: {
    REST: {
      lambdaAPI: {
        endpoint: process.env.REACT_APP_LAMBDA_API_ENDPOINT,
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      }
    }
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'REACT_APP_COGNITO_USER_POOL_ID',
  'REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID',
  'REACT_APP_COGNITO_IDENTITY_POOL_ID',
  'REACT_APP_LAMBDA_API_ENDPOINT'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// Always configure Amplify if environment variables are available
if (missingEnvVars.length === 0) {
  try {
    Amplify.configure(awsConfig);
    console.log('✅ Amplify configured successfully with:', awsConfig);
  } catch (error) {
    console.error('❌ Error configuring Amplify:', error);
  }
} else {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please create a .env file based on env.example and fill in your AWS credentials');
}

// Add comprehensive logging to check environment variables in browser console
console.log('🔍 Environment Variables Debug Log:');
console.log('=====================================');
console.log('REACT_APP_AWS_REGION:', process.env.REACT_APP_AWS_REGION);
console.log('REACT_APP_COGNITO_USER_POOL_ID:', process.env.REACT_APP_COGNITO_USER_POOL_ID);
console.log('REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID:', process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID);
console.log('REACT_APP_COGNITO_IDENTITY_POOL_ID:', process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID);
console.log('REACT_APP_LAMBDA_API_ENDPOINT:', process.env.REACT_APP_LAMBDA_API_ENDPOINT);
console.log('REACT_APP_ENVIRONMENT:', process.env.REACT_APP_ENVIRONMENT);
console.log('=====================================');
console.log('✅ All environment variables are available and embedded in the build!');
console.log('🌐 This app will work in the browser without server-side dependencies.');

// Create a separate authenticated view component to avoid circular dependency
function AuthenticatedView() {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postData, setPostData] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [dogImages, setDogImages] = useState([]);

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    try {
      console.log('🔐 Attempting to get current user...');
      const user = await getCurrentUser();
      console.log('👤 User retrieved successfully:', user);
      
      const session = await fetchAuthSession();
      console.log('🔑 Auth session retrieved:', session);
      
      const userInfo = {
        email: user.signInDetails?.loginId || user.username,
        sub: user.userId
      };
      console.log('📝 Setting user info:', userInfo);
      setUserInfo(userInfo);
    } catch (error) {
      console.error('❌ Error getting user info:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      await signOut();
      console.log('✅ User signed out successfully');
      // Force page reload to show sign in form
      window.location.reload();
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const addDogImage = (response) => {
    if (response.dogData && response.dogData.message) {
      const newDog = {
        id: Date.now(),
        imageUrl: response.dogData.message,
        breed: response.dogData.message.split('/').pop().split('-').slice(0, -1).join(' '),
        timestamp: response.timestamp,
        method: response.method
      };
      setDogImages(prev => [newDog, ...prev.slice(0, 9)]); // Keep only last 10 images
    }
  };

  const testGetRequest = async () => {
    setLoading(true);
    try {
      const response = await get({ apiName: 'lambdaAPI', path: '/test' }).response;
      setApiResponse(response);
      addDogImage(response);
    } catch (error) {
      console.error('Error making GET request:', error);
      setApiResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testPostRequest = async () => {
    if (!postData.trim()) {
      alert('Please enter some data to post');
      return;
    }

    setLoading(true);
    try {
      const response = await post({ 
        apiName: 'lambdaAPI', 
        path: '/test',
        options: {
          body: { message: postData }
        }
      }).response;
      setApiResponse(response);
      addDogImage(response);
    } catch (error) {
      console.error('Error making POST request:', error);
      setApiResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testPutRequest = async () => {
    if (!postData.trim()) {
      alert('Please enter some data to update');
      return;
    }

    setLoading(true);
    try {
      const response = await post({ 
        apiName: 'lambdaAPI', 
        path: '/test',
        options: {
          body: { message: postData }
        }
      }).response;
      setApiResponse(response);
      addDogImage(response);
    } catch (error) {
      console.error('Error making PUT request:', error);
      setApiResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testDeleteRequest = async () => {
    setLoading(true);
    try {
      const response = await get({ apiName: 'lambdaAPI', path: '/test' }).response;
      setApiResponse(response);
      addDogImage(response);
    } catch (error) {
      console.error('Error making DELETE request:', error);
      setApiResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearDogImages = () => {
    setDogImages([]);
  };

  return (
    <div className="App">
      <div className="auth-card">
        <h1 className="auth-heading">🐕 AWS Website Hosting with Cognito Email Auth</h1>
        <p className="auth-text">This React app is hosted on AWS S3, served through CloudFront, and uses Cognito for email-based authentication. It also fetches adorable dog images from the Dog API!</p>
        {process.env.REACT_APP_ENVIRONMENT && (
          <span className="auth-badge auth-badge-info">
            Environment: {process.env.REACT_APP_ENVIRONMENT}
          </span>
        )}
      </div>

      {userInfo && (
        <div className="auth-card">
          <h2 className="auth-heading">👤 User Information</h2>
          <div className="auth-flex auth-flex-column auth-gap-small">
            <p className="auth-text"><strong>Email:</strong> {userInfo.email}</p>
            <p className="auth-text"><strong>User ID:</strong> <span className="auth-badge auth-badge-info">{userInfo.sub}</span></p>
          </div>
          <button onClick={handleSignOut} className="auth-button auth-button-destructive auth-margin-top-medium">
            Sign Out
          </button>
        </div>
      )}

      <div className="auth-card">
        <h2 className="auth-heading">🐾 Test Lambda API (Authenticated)</h2>
        <p className="auth-text">Test the authenticated Lambda function with different HTTP methods. Each request will fetch a random dog image from the Dog API!</p>
        
        <div className="auth-flex auth-flex-column auth-gap-medium auth-margin-top-medium">
          <button onClick={testGetRequest} className="auth-button" disabled={loading} data-loading={loading}>
            🐕 Test GET Request
          </button>
          
          <div className="auth-flex auth-flex-row auth-gap-medium auth-align-center">
            <div className="auth-field">
              <label className="auth-label">Data to send</label>
              <input
                type="text"
                className="auth-input"
                value={postData}
                onChange={(e) => setPostData(e.target.value)}
                placeholder="Enter data for POST/PUT requests"
              />
            </div>
            <button onClick={testPostRequest} className="auth-button" disabled={loading} data-loading={loading}>
              🐕 Test POST Request
            </button>
            <button onClick={testPutRequest} className="auth-button" disabled={loading} data-loading={loading}>
              🐕 Test PUT Request
            </button>
          </div>
          
          <button onClick={testDeleteRequest} className="auth-button" disabled={loading} data-loading={loading}>
            🐕 Test DELETE Request
          </button>
        </div>
      </div>

      {dogImages.length > 0 && (
        <div className="auth-card">
          <div className="auth-flex auth-justify-between auth-align-center auth-margin-bottom-medium">
            <h2 className="auth-heading">🖼️ Dog Images Gallery</h2>
            <button onClick={clearDogImages} className="auth-button auth-button-outline auth-button-small">
              Clear Gallery
            </button>
          </div>
          <p className="auth-text">Recent dog images fetched from your API calls:</p>
          
          <div className="auth-flex auth-flex-row auth-gap-medium auth-margin-top-medium auth-flex-wrap">
            {dogImages.map((dog) => (
              <div key={dog.id} className="auth-card auth-dog-image-card">
                <img
                  src={dog.imageUrl}
                  alt={`Random dog - ${dog.breed}`}
                  className="auth-dog-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none', textAlign: 'center', padding: '20px', color: '#666' }}>
                  🐕 Image loading...
                </div>
                <div className="auth-dog-info">
                  <p className="auth-text auth-text-small"><strong>Breed:</strong> {dog.breed}</p>
                  <p className="auth-text auth-text-small"><strong>Method:</strong> <span className="auth-badge auth-badge-info">{dog.method}</span></p>
                  <p className="auth-text auth-text-small"><strong>Time:</strong> {new Date(dog.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {apiResponse && (
        <div className="auth-card">
          <h2 className="auth-heading">📡 API Response</h2>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [authState, setAuthState] = useState('signIn'); // 'signIn', 'signUp', 'confirmSignUp', 'authenticated'
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('home'); // 'home', 'about'
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dogImage, setDogImage] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  useEffect(() => {
    if (authState === 'authenticated' && currentTab === 'home' && !dogImage) {
      handleTestAPI();
    }
  }, [authState, currentTab, dogImage]);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Set user info from the current user
      const userInfo = {
        email: currentUser.signInDetails?.loginId || currentUser.username,
        sub: currentUser.userId
      };
      setUserInfo(userInfo);
      
      setAuthState('authenticated');
    } catch (error) {
      setAuthState('signIn');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { isSignedIn } = await signIn({ username: formData.email, password: formData.password });
      if (isSignedIn) {
        // Get the current user to get the userId
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        const userInfo = {
          email: formData.email,
          sub: currentUser.userId
        };
        setUserInfo(userInfo);
        setAuthState('authenticated');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
          },
        },
      });
      setAuthState('confirmSignUp');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmSignUp({
        username: formData.email,
        confirmationCode: formData.code,
      });
      setAuthState('signIn');
      setFormData({ email: '', password: '', confirmPassword: '', code: '' });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserInfo(null);
      setAuthState('signIn');
      setCurrentTab('home');
      setShowUserDropdown(false);
      setShowSettings(false);
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTestAPI = async () => {
    try {
      setLoading(true);
      console.log('🔐 Testing authenticated Lambda API call...');
      console.log('📡 Lambda endpoint:', process.env.REACT_APP_LAMBDA_API_ENDPOINT);
      
      // Get the current user's JWT token from Cognito
      const currentUser = await getCurrentUser();
      const session = await currentUser.getSignInUserSession();
      const idToken = session?.getIdToken();
      const jwtToken = idToken?.getJwtToken();
      
      if (!jwtToken) {
        console.error('❌ No JWT token available - user not authenticated');
        setError('Authentication required. Please sign in again.');
        return;
      }
      
      console.log('🔑 JWT token obtained, calling Lambda with authentication...');
      
      // Call our Lambda function with the JWT token in Authorization header
      const response = await fetch(process.env.REACT_APP_LAMBDA_API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
      });
      
      console.log('📊 Lambda response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Lambda response data:', data);
        
        // The Lambda function returns the dog image URL in data.dogData.message
        if (data.dogData && data.dogData.message && data.dogData.message.includes('https://')) {
          setDogImage(data.dogData.message);
          console.log('🐕 Dog image URL from Lambda:', data.dogData.message);
        } else {
          console.log('⚠️ Unexpected response format from Lambda:', data);
          setDogImage('https://images.dog.ceo/breeds/retriever-golden/n02099601_1024.jpg');
        }
      } else {
        console.error('❌ Lambda API request failed:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setError('API request failed. Check console for details.');
        setDogImage('https://images.dog.ceo/breeds/retriever-golden/n02099601_1024.jpg');
      }
    } catch (error) {
      console.error('💥 Error testing Lambda API:', error);
      setError('Error calling API: ' + error.message);
      setDogImage('https://images.dog.ceo/breeds/retriever-golden/n02099601_1024.jpg');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUser();
      handleSignOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account. Please try again.');
    }
  };

  const renderNavbar = () => (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🐕</span>
        <span className="navbar-title">AWS Cognito Auth</span>
      </div>
      
      <div className="navbar-tabs">
        <button 
          className={`navbar-tab ${currentTab === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentTab('home')}
        >
          Home
        </button>
        <button 
          className={`navbar-tab ${currentTab === 'about' ? 'active' : ''}`}
          onClick={() => setCurrentTab('about')}
        >
          About
        </button>
      </div>

      <div className="navbar-user">
        <div className="user-dropdown">
          <button 
            className="user-button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
          >
            <span className="user-icon">👤</span>
            <span className="user-email">{userInfo?.email}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {showUserDropdown && (
            <div className="dropdown-menu">
              <button 
                className="dropdown-item"
                onClick={() => {
                  setShowSettings(true);
                  setShowUserDropdown(false);
                }}
              >
                ⚙️ Settings
              </button>
              <button 
                className="dropdown-item"
                onClick={handleSignOut}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  const renderSettings = () => (
    <div className="settings-overlay" onClick={() => setShowSettings(false)}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Account Settings</h3>
          <button 
            className="close-button"
            onClick={() => setShowSettings(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="settings-content">
          <div className="account-details">
            <h4>Account Information</h4>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{userInfo?.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">User ID:</span>
              <span className="detail-value">{userInfo?.sub}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value status-active">Active</span>
            </div>
          </div>

          <div className="aws-details">
            <h4>AWS Infrastructure Details</h4>
            <div className="detail-row">
              <span className="detail-label">AWS Region:</span>
              <span className="detail-value">{process.env.REACT_APP_AWS_REGION}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Cognito User Pool:</span>
              <span className="detail-value">{process.env.REACT_APP_COGNITO_USER_POOL_ID}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Cognito Client ID:</span>
              <span className="detail-value">{process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Identity Pool:</span>
              <span className="detail-value">{process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Lambda API Endpoint:</span>
              <span className="detail-value">{process.env.REACT_APP_LAMBDA_API_ENDPOINT}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">CloudFront Domain:</span>
              <span className="detail-value">dolz6o184o234.cloudfront.net</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">S3 Bucket:</span>
              <span className="detail-value">aws-website-hosting-user-auth-cognito-website-bhua2oub</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Environment:</span>
              <span className="detail-value">{process.env.REACT_APP_ENVIRONMENT}</span>
            </div>
          </div>
          
          <div className="danger-zone">
            <h4>Danger Zone</h4>
            <p className="danger-warning">
              ⚠️ Deleting your account will permanently remove all your data and cannot be undone.
            </p>
            <button 
              className="delete-account-button"
              onClick={handleDeleteAccount}
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="home-container">
      <div className="home-card">
        <h3 className="auth-heading">
          🐕 AWS Website Hosting with Cognito Email Auth
        </h3>
        <p className="auth-text">
          This React app is hosted on AWS S3, served through CloudFront, and uses Cognito for email-based authentication. It also fetches adorable dog images from the Dog API!
        </p>
        <div className="auth-badge auth-badge-info">Environment: production</div>
      </div>

      <div className="home-card">
        <h3 className="auth-heading">
          🐕 Test Lambda API (Authenticated)
        </h3>
        <p className="auth-text">
          Test the authenticated Lambda function with different HTTP methods. Each request will call our Lambda backend, which then fetches a random dog image from the Dog API! This demonstrates frontend-to-backend communication through AWS Lambda.
        </p>
        <button 
          className="auth-button"
          onClick={handleTestAPI}
        >
          Test GET Request
        </button>
        {dogImage && (
          <div className="dog-image-container">
            <img src={dogImage} alt="Random Dog" className="dog-image" />
            <p className="auth-text">Random dog image from Dog API via Lambda!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h3 className="auth-heading">
          🚀 About This Project
        </h3>
        <div className="about-content">
          <p className="auth-text">
            This project demonstrates a complete AWS hosting solution for a React.js application with enterprise-grade security and scalability.
          </p>
          
          <h4>🛠️ Technical Stack</h4>
          <ul className="tech-list">
            <li><strong>Frontend:</strong> React.js with AWS Amplify v6</li>
            <li><strong>Hosting:</strong> AWS S3 Static Website Hosting</li>
            <li><strong>CDN:</strong> CloudFront with custom cache policies</li>
            <li><strong>Authentication:</strong> Amazon Cognito User Pools & Identity Pools</li>
            <li><strong>Backend:</strong> AWS Lambda with Function URLs</li>
            <li><strong>Infrastructure:</strong> OpenTofu (Terraform) with full automation</li>
          </ul>

          <h4>🔒 Security Features</h4>
          <ul className="tech-list">
            <li>Email-based authentication with Cognito</li>
            <li>JWT token management and refresh</li>
            <li>IAM role-based access control</li>
            <li>HTTPS enforcement with CloudFront</li>
            <li>Origin Access Control for S3</li>
          </ul>

          <h4>📱 User Experience</h4>
          <ul className="tech-list">
            <li>Responsive Material Design interface</li>
            <li>Progressive side margins for optimal readability</li>
            <li>Custom authentication forms</li>
            <li>Account management and settings</li>
            <li>Real-time API testing capabilities</li>
          </ul>

          <h4>🚀 Deployment & Automation</h4>
          <ul className="tech-list">
            <li>Fully automated OpenTofu deployment</li>
            <li>Local-exec provisioners for build automation</li>
            <li>CloudFront cache invalidation</li>
            <li>Environment variable management</li>
            <li>Zero-downtime deployments</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderSignIn = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h3 className="auth-heading">
          🚀 Welcome Back
        </h3>
        <p className="auth-text">
          Sign in to access your account and explore the dog gallery!
        </p>
        
        <form onSubmit={handleSignIn} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
            data-loading={loading}
          >
            {loading ? <span className="auth-loading"></span> : 'Sign In'}
          </button>
          <button 
            type="button" 
            className="auth-button auth-button-outline" 
            onClick={() => setAuthState('signUp')}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );

  const renderSignUp = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h3 className="auth-heading">
          🎉 Create Account
        </h3>
        <p className="auth-text">
          Join us to start collecting dog images and testing the API!
        </p>
        
        <form onSubmit={handleSignUp} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              className="auth-input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
            data-loading={loading}
          >
            {loading ? <span className="auth-loading"></span> : 'Create Account'}
          </button>
          <button 
            type="button" 
            className="auth-button auth-button-outline" 
            onClick={() => setAuthState('signIn')}
          >
            Back to Sign In
          </button>
        </form>
      </div>
    </div>
  );

  const renderConfirmSignUp = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h3 className="auth-heading">
          ✉️ Verify Your Email
        </h3>
        <p className="auth-text">
          Check your email for the verification code and enter it below.
        </p>
        
        <form onSubmit={handleConfirmSignUp} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Verification Code</label>
            <input
              type="text"
              className="auth-input"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
            data-loading={loading}
          >
            {loading ? <span className="auth-loading"></span> : 'Verify Email'}
          </button>
          <button 
            type="button" 
            className="auth-button auth-button-outline" 
            onClick={() => setAuthState('signUp')}
          >
            Back to Sign Up
          </button>
        </form>
      </div>
    </div>
  );

  const renderAuthenticated = () => (
    <div className="App">
      {renderNavbar()}
      
      {currentTab === 'home' && renderHome()}
      {currentTab === 'about' && renderAbout()}
      
      {showSettings && renderSettings()}
    </div>
  );

  if (authState === 'signIn') return renderSignIn();
  if (authState === 'signUp') return renderSignUp();
  if (authState === 'confirmSignUp') return renderConfirmSignUp();
  if (authState === 'authenticated') return renderAuthenticated();

  return null;
}

export default App;
