# CloudFront distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled    = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
    origin_id                = "S3-${aws_s3_bucket.website.id}"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id = aws_cloudfront_cache_policy.default.id
  }

  # Handle SPA routing - redirect all routes to index.html
  ordered_cache_behavior {
    path_pattern     = "/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.website.id}"

    cache_policy_id = aws_cloudfront_cache_policy.spa.id

    viewer_protocol_policy = "redirect-to-https"
  }

  # Error page for SPA routing
  custom_error_response {
    error_code         = 403
    response_code      = "200"
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = "200"
    response_page_path = "/index.html"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Force update on every apply by including a unique identifier
  # This ensures the distribution is recreated/updated on each deployment
  comment = "Last updated: ${timestamp()}"
  
  tags = merge(local.common_tags, {
    LastUpdated = timestamp()
    DeploymentId = uuid()
    BuildTimestamp = formatdate("YYYY-MM-DD-HH-mm-ss", timestamp())
  })

  # No depends_on needed - CloudFront will be created first
  # Automation will then update it through cache invalidation
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${local.project_name}-oac"
  description                       = "Origin Access Control for S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Default cache policy for static assets
resource "aws_cloudfront_cache_policy" "default" {
  name        = "${local.project_name}-default-cache-policy"
  comment     = "Default cache policy for static assets"
  default_ttl = 3600
  max_ttl     = 86400
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# SPA cache policy - no caching for dynamic routes
resource "aws_cloudfront_cache_policy" "spa" {
  name        = "${local.project_name}-spa-cache-policy"
  comment     = "Cache policy for SPA routes - no caching"
  default_ttl = 0
  max_ttl     = 0
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}
