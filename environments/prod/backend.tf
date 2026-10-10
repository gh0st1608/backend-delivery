terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2"
    }
  }

  # Estado remoto en Terraform Cloud
  cloud {
    organization = "solutionserj"

    workspaces {
      name = "backend-delivery"
    }
  }
}
