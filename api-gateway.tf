# API Gateway for Lambda integration with Cognito authentication
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.project_name}-api"
  description = "API Gateway for authenticated Lambda functions"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

# Cognito Authorizer for API Gateway
resource "aws_api_gateway_authorizer" "cognito" {
  name                   = "cognito-authorizer"
  rest_api_id           = aws_api_gateway_rest_api.main.id
  type                  = "COGNITO_USER_POOLS"
  provider_arns         = [aws_cognito_user_pool.main.arn]
  identity_source       = "method.request.header.Authorization"
}

# API Gateway Resource for Lambda
resource "aws_api_gateway_resource" "lambda" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "api"
}

# API Gateway Method for GET requests
resource "aws_api_gateway_method" "get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.lambda.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

# API Gateway Method for POST requests
resource "aws_api_gateway_method" "post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.lambda.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

# API Gateway Method for DELETE requests
resource "aws_api_gateway_method" "delete" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.lambda.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.header.Authorization" = true
  }
}

# API Gateway Method for OPTIONS (CORS)
resource "aws_api_gateway_method" "options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.lambda.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integration for GET method
resource "aws_api_gateway_integration" "get" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.lambda.id
  http_method = aws_api_gateway_method.get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api.invoke_arn
}

# Integration for POST method
resource "aws_api_gateway_integration" "post" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.lambda.id
  http_method = aws_api_gateway_method.post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api.invoke_arn
}

# Integration for DELETE method
resource "aws_api_gateway_integration" "delete" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.lambda.id
  http_method = aws_api_gateway_method.delete.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api.invoke_arn
}

# Integration for OPTIONS method (CORS)
resource "aws_api_gateway_integration" "options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.lambda.id
  http_method = aws_api_gateway_method.options.http_method

  type = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Method response for OPTIONS
resource "aws_api_gateway_method_response" "options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.lambda.id
  http_method = aws_api_gateway_method.options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# Integration response for OPTIONS
resource "aws_api_gateway_integration_response" "options" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.lambda.id
  http_method = aws_api_gateway_method.options.http_method
  status_code = aws_api_gateway_method_response.options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# IAM role for API Gateway to invoke Lambda
resource "aws_iam_role" "api_gateway_lambda" {
  name = "${local.project_name}-api-gateway-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for API Gateway to invoke Lambda
resource "aws_iam_role_policy" "api_gateway_lambda" {
  name = "${local.project_name}-api-gateway-lambda-policy"
  role = aws_iam_role.api_gateway_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = aws_lambda_function.api.arn
      }
    ]
  })
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.get,
    aws_api_gateway_integration.post,
    aws_api_gateway_integration.delete,
    aws_api_gateway_integration.options,
    aws_api_gateway_integration_response.options
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = "prod"

  # Force deployment update when CORS or methods change
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.get.id,
      aws_api_gateway_integration.post.id,
      aws_api_gateway_integration.delete.id,
      aws_api_gateway_integration.options.id,
      aws_api_gateway_integration_response.options.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}
