terraform {
  cloud {
    organization = "foodstore-sdc"

    workspaces {
      name = "backend-delivery-dev" 
      # o prefix = "app-" si quieres que distintos workspaces compartan este código
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.AWS_REGION
}
