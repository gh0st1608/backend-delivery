terraform {
  cloud {
    organization = "foodstore-sdc"

    workspaces {
      # puedes dejar un workspace fijo o usar prefix
      name = "backend-delivery-dev" 
      # o prefix = "app-" si quieres que distintos workspaces compartan este código
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # mejor usar algo más reciente que 3.0
    }
  }
}

provider "aws" {
  region = var.region
}
