locals {
  project_name = "aws-website-hosting-user-auth-cognito"
  environment  = "dev"
  
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
  }
}
