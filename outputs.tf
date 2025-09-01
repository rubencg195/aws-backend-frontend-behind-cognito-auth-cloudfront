# Outputs for important resource information

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for website hosting"
  value       = aws_s3_bucket.website.bucket
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = aws_cognito_identity_pool.main.id
}

output "lambda_function_url" {
  description = "Lambda function URL for API calls"
  value       = aws_lambda_function_url.api.function_url
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.api.arn
}

output "website_url" {
  description = "Website URL (CloudFront)"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

# API Gateway URL
output "api_gateway_url" {
  description = "API Gateway URL for authenticated Lambda invocation"
  value       = "${aws_api_gateway_deployment.main.invoke_url}/api"
}
