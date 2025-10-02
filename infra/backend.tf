terraform {
    cloud {
    organization = "solutionserj"

    workspaces {
      name = "backend-delivery" 
      # o prefix = "app-" si quieres que distintos workspaces compartan este código
    }
  }
  /* backend "remote" {
    organization = "solutionserj"

    workspaces {
      name = "formcorp-serverless"
    }
  } */
}