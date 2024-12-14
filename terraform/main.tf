terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "utility-bill-manager-terraform-state"
    key    = "preview/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and Network Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "utility-bill-manager-preview"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Environment = "preview"
    Project     = "utility-bill-manager"
  }
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "utility-bill-manager-preview-alb"
  description = "Security group for ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "utility-bill-manager-preview-alb"
    Environment = "preview"
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "utility-bill-manager-preview-ecs"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "utility-bill-manager-preview-ecs"
    Environment = "preview"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "utility-bill-manager-preview"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = module.vpc.public_subnets

  enable_deletion_protection = true

  tags = {
    Environment = "preview"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Target Group
resource "aws_lb_target_group" "app" {
  name        = "utility-bill-manager-preview"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval           = "30"
    protocol           = "HTTP"
    matcher            = "200"
    timeout            = "3"
    path              = "/health"
    unhealthy_threshold = "2"
  }

  tags = {
    Environment = "preview"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "utility-bill-manager-preview"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = "preview"
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "utility-bill-manager-preview-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task_role" {
  name = "utility-bill-manager-preview-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# S3 Bucket for File Storage
resource "aws_s3_bucket" "files" {
  bucket = "utility-bill-manager-preview-files"

  tags = {
    Environment = "preview"
  }
}

resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# KMS Key for Data Encryption
resource "aws_kms_key" "app" {
  description             = "KMS key for utility-bill-manager preview"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Environment = "preview"
  }
}

resource "aws_kms_alias" "app" {
  name          = "alias/utility-bill-manager-preview"
  target_key_id = aws_kms_key.app.key_id
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier        = "utility-bill-manager-preview"
  engine           = "postgres"
  engine_version   = "13.7"
  instance_class   = "db.t3.micro"
  allocated_storage = 20

  db_name  = "utility_bills"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  skip_final_snapshot    = true

  storage_encrypted = true
  kms_key_id       = aws_kms_key.app.arn

  tags = {
    Environment = "preview"
  }
}

# Redis for Caching
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "utility-bill-manager-preview"
  engine              = "redis"
  node_type           = "cache.t3.micro"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis6.x"
  port                = 6379
  security_group_ids  = [aws_security_group.redis.id]
  subnet_group_name   = aws_elasticache_subnet_group.main.name

  tags = {
    Environment = "preview"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/utility-bill-manager-preview"
  retention_in_days = 30

  tags = {
    Environment = "preview"
  }
}

# Route53 and ACM
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Environment = "preview"
  }
}

resource "aws_acm_certificate" "main" {
  domain_name       = "preview.${var.domain_name}"
  validation_method = "DNS"

  tags = {
    Environment = "preview"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
