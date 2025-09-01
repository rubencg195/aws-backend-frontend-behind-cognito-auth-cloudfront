# Automation and Configuration Management
# This file handles the complete automated deployment process using OpenTofu local-exec

# Resource to create Lambda package first
resource "null_resource" "lambda_package" {
  provisioner "local-exec" {
    interpreter = ["powershell", "-Command"]
    command = <<-EOT
      Write-Host "🧹 Cleaning up old files..."
      if (Test-Path "lambda.zip") { Remove-Item "lambda.zip" -Force }
      if (Test-Path "build") { Remove-Item "build" -Recurse -Force }
      if (Test-Path ".env") { Remove-Item ".env" -Force }
      if (Test-Path "config.json") { Remove-Item "config.json" -Force }
      Write-Host "✅ Cleanup completed"
      
      Write-Host "📦 Creating Lambda package..."
      if (Test-Path "lambda") {
        Set-Location "lambda"
        npm install --silent
        Set-Location ".."
        Compress-Archive -Path "lambda\*" -DestinationPath "lambda.zip" -Force
        Write-Host "✅ Lambda function packaged successfully!"
      } else {
        Write-Host "⚠️  Warning: lambda directory not found, creating empty package"
        "{}" | Out-File "lambda.zip" -Encoding UTF8
      }
    EOT
    working_dir = path.root
  }
}

# Single null resource to handle all automation steps
resource "null_resource" "full_automation" {
  triggers = {
    # Force update on every apply by including timestamp and random value
    timestamp = timestamp()
    random_trigger = uuid()
    # Also trigger when any of these resources change
    cognito_user_pool_id = aws_cognito_user_pool.main.id
    cognito_user_pool_client_id = aws_cognito_user_pool_client.main.id
    cognito_identity_pool_id = aws_cognito_identity_pool.main.id
    lambda_function_url = aws_lambda_function_url.api.function_url
    cloudfront_domain = aws_cloudfront_distribution.main.domain_name
    s3_bucket_name = aws_s3_bucket.website.id
    # Note: CloudFront triggers are removed to avoid circular dependencies
    # CloudFront will be updated through cache invalidation in the automation
  }

  provisioner "local-exec" {
    interpreter = ["powershell", "-Command"]
    command = <<-EOT
      Write-Host "🔧 Starting complete automation process..."
      Write-Host "Current directory: $(Get-Location)"
      Write-Host "Current time: $(Get-Date)"
      
      # Step 0: Create .env file FIRST (before building React app)
      Write-Host "📝 Step 0: Creating environment configuration FIRST..."
      Write-Host "Creating .env file with AWS configuration..."
      
      $envContent = @"
# AWS Configuration
# Generated from Terraform outputs - DO NOT COMMIT TO VERSION CONTROL

# AWS Region
REACT_APP_AWS_REGION=us-east-1

# Cognito Configuration
REACT_APP_COGNITO_USER_POOL_ID=${aws_cognito_user_pool.main.id}
REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID=${aws_cognito_user_pool_client.main.id}
REACT_APP_COGNITO_IDENTITY_POOL_ID=${aws_cognito_identity_pool.main.id}

# Lambda API Configuration
REACT_APP_LAMBDA_API_ENDPOINT=${aws_lambda_function_url.api.function_url}

# Environment indicator
REACT_APP_ENVIRONMENT=production

# ⚠️  WARNING: This file contains sensitive information
# ⚠️  DO NOT commit this file to version control
# ⚠️  This file is already in .gitignore
"@
      
      [System.IO.File]::WriteAllText(".env", $envContent, [System.Text.Encoding]::UTF8)
      
      if (Test-Path ".env") {
        Write-Host "✅ Environment file created: .env"
        Write-Host "File size:"
        Get-ChildItem ".env" | Select-Object Name, Length
      } else {
        Write-Host "❌ Failed to create .env file!"
        exit 1
      }
      
      # Step 1: Build React app (now with .env available)
      Write-Host "📦 Step 1: Building React application..."
      if (Test-Path "package.json") {
        Write-Host "✅ package.json found in $(Get-Location)"
        Write-Host "Installing dependencies..."
        npm install --silent
        if ($LASTEXITCODE -ne 0) {
          Write-Host "❌ npm install failed with error code $LASTEXITCODE"
          exit $LASTEXITCODE
        }
        Write-Host "Building React app..."
        npm run build --silent
        if ($LASTEXITCODE -ne 0) {
          Write-Host "❌ npm run build failed with error code $LASTEXITCODE"
          exit $LASTEXITCODE
        }
        Write-Host "✅ React app built successfully!"
      } else {
        Write-Host "❌ Error: package.json not found in root directory!"
        Write-Host "Current directory contents:"
        Get-ChildItem
        exit 1
      }
      
      # Step 2: Create config.json for reference
      Write-Host "📝 Step 2: Creating configuration file..."
      Write-Host "Creating config.json with AWS configuration..."
      
      $configContent = @"
{
  "aws": {
    "region": "us-east-1",
    "cognito": {
      "userPoolId": "${aws_cognito_user_pool.main.id}",
      "userPoolWebClientId": "${aws_cognito_user_pool_client.main.id}",
      "identityPoolId": "${aws_cognito_identity_pool.main.id}"
    },
    "lambda": {
      "functionUrl": "${aws_lambda_function_url.api.function_url}"
    },
    "cloudfront": {
      "domain": "${aws_cloudfront_distribution.main.domain_name}"
    },
    "s3": {
      "bucket": "${aws_s3_bucket.website.id}"
    }
  },
  "website": {
    "url": "https://${aws_cloudfront_distribution.main.domain_name}"
  }
}
"@
      
      [System.IO.File]::WriteAllText("config.json", $configContent, [System.Text.Encoding]::UTF8)
      
      if (Test-Path "config.json") {
        Write-Host "✅ Configuration file created: config.json"
        Write-Host "File size:"
        Get-ChildItem "config.json" | Select-Object Name, Length
      } else {
        Write-Host "❌ Failed to create config.json!"
        exit 1
      }
      
      # Step 3: Update src/App.js with real values using PowerShell
      Write-Host "📝 Step 3: Updating React App.js configuration..."
      if (Test-Path "src\App.js") {
        Write-Host "✅ src\App.js found, updating configuration..."
        $content = Get-Content "src\App.js" -Raw
        $content = $content -replace "userPoolId: '[^']*'", "userPoolId: '${aws_cognito_user_pool.main.id}'"
        $content = $content -replace "userPoolWebClientId: '[^']*'", "userPoolWebClientId: '${aws_cognito_user_pool_client.main.id}'"
        $content = $content -replace "identityPoolId: '[^']*'", "identityPoolId: '${aws_cognito_identity_pool.main.id}'"
        $content = $content -replace "endpoint: '[^']*'", "endpoint: '${aws_lambda_function_url.api.function_url}'"
        [System.IO.File]::WriteAllText("src\App.js", $content, [System.Text.Encoding]::UTF8)
        Write-Host "✅ React App.js configuration updated with real values"
      } else {
        Write-Host "❌ Error: src\App.js not found!"
        Write-Host "src directory contents:"
        Get-ChildItem "src"
        exit 1
      }
      
      # Step 4: Rebuild React app with updated configuration
      Write-Host "🔨 Step 4: Rebuilding React application with real configuration..."
      Write-Host "Rebuilding from root directory..."
      npm run build --silent
      if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm run build failed with error code $LASTEXITCODE"
        exit $LASTEXITCODE
      }
      Write-Host "✅ React app rebuilt successfully with real configuration!"
      
      # Step 5: Upload to S3
      Write-Host "📤 Step 5: Uploading to S3 bucket..."
      if (Test-Path "build") {
        Write-Host "✅ build directory found, uploading to S3..."
        aws s3 sync build\ s3://${aws_s3_bucket.website.id} --delete
        if ($LASTEXITCODE -ne 0) {
          Write-Host "❌ S3 sync failed with error code $LASTEXITCODE"
          exit $LASTEXITCODE
        }
        Write-Host "✅ Upload to S3 completed successfully!"
      } else {
        Write-Host "❌ Error: build directory not found!"
        Write-Host "Current directory contents:"
        Get-ChildItem
        exit 1
      }
      
      # Step 6: Force CloudFront cache invalidation and distribution update
      Write-Host "🔄 Step 6: Forcing CloudFront cache invalidation and distribution update..."
      Write-Host "This will ensure the latest version is served and force distribution updates..."
      aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.main.id} --paths "/*"
      if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ CloudFront invalidation failed with error code $LASTEXITCODE"
        exit $LASTEXITCODE
      }
      Write-Host "✅ CloudFront cache invalidation initiated!"
      
      # Step 7: Cleanup temporary files
      Write-Host "🧹 Step 7: Cleaning up temporary files..."
      if (Test-Path "lambda.zip") {
        Remove-Item "lambda.zip" -Force
        Write-Host "✅ Cleaned up lambda.zip"
      }
      if (Test-Path "build") {
        Remove-Item "build" -Recurse -Force
        Write-Host "✅ Cleaned up build directory"
      }
      
      Write-Host "✅ All automation steps completed successfully!"
      Write-Host "Final directory contents:"
      Get-ChildItem
      Write-Host ""
      Write-Host "📊 Deployment Summary:"
      Write-Host "======================"
      Write-Host "🌐 Website URL: https://${aws_cloudfront_distribution.main.domain_name}"
      Write-Host "☁️  CloudFront Domain: ${aws_cloudfront_distribution.main.domain_name}"
      Write-Host "🪣 S3 Bucket: ${aws_s3_bucket.website.id}"
      Write-Host "🔐 Cognito User Pool ID: ${aws_cognito_user_pool.main.id}"
      Write-Host "🔑 Cognito Client ID: ${aws_cognito_user_pool_client.main.id}"
      Write-Host "🆔 Cognito Identity Pool ID: ${aws_cognito_identity_pool.main.id}"
      Write-Host "⚡ Lambda Function URL: ${aws_lambda_function_url.api.function_url}"
      Write-Host ""
      Write-Host "🔒 Security Note: The .env file is automatically gitignored"
      Write-Host "⚠️  CloudFront distribution may take 10-15 minutes to fully deploy"
      Write-Host ""
      Write-Host "📝 Next steps:"
      Write-Host "1. Wait for CloudFront distribution to be ready"
      Write-Host "2. Test your application at the website URL above"
      Write-Host "3. Create a user account and test authentication"
      Write-Host "4. Test the API endpoints and dog image gallery"
    EOT
    working_dir = path.root
  }

  depends_on = [
    aws_cognito_user_pool.main,
    aws_cognito_user_pool_client.main,
    aws_cognito_identity_pool.main,
    aws_lambda_function.api,
    aws_lambda_function_url.api,
    aws_s3_bucket.website,
    null_resource.lambda_package,
    # Note: aws_cloudfront_distribution.main is NOT in depends_on
    # This allows automation to run after CloudFront is created
    # and then trigger CloudFront updates through cache invalidation
  ]
}

# Output the automation status
output "automation_status" {
  description = "Status of automated configuration and deployment"
  value = {
    completed = null_resource.full_automation.id
    message = "Complete automation finished successfully!"
    steps = [
      "Cleanup old files",
      "Lambda function packaged",
      "React app built",
      "Environment configuration created",
      "React configuration updated",
      "React app rebuilt with real values",
      "App uploaded to S3",
      "CloudFront cache invalidated",
      "Temporary files cleaned up"
    ]
  }
  
  depends_on = [
    null_resource.full_automation
  ]
}
