terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "campus-vibe-terraform-state"
    key    = "terraform.tfstate"
    region = "af-south-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Campus Vibe"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "af-south-1" # Cape Town region
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "campus-vibe"
}

# VPC
module "vpc" {
  source = "./modules/vpc"

  app_name    = var.app_name
  environment = var.environment
}

# RDS PostgreSQL
module "database" {
  source = "./modules/rds"

  app_name           = var.app_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
}

# ElastiCache Redis
module "cache" {
  source = "./modules/elasticache"

  app_name           = var.app_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
}

# S3 Bucket for media
module "storage" {
  source = "./modules/s3"

  app_name    = var.app_name
  environment = var.environment
}

# OpenSearch
module "search" {
  source = "./modules/opensearch"

  app_name           = var.app_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"

  app_name           = var.app_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
}

# Outputs
output "database_endpoint" {
  value     = module.database.endpoint
  sensitive = true
}

output "cache_endpoint" {
  value = module.cache.endpoint
}

output "storage_bucket" {
  value = module.storage.bucket_name
}

output "search_endpoint" {
  value = module.search.endpoint
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}
