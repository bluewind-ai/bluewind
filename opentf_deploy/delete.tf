# provider "aws" {
#   region = "us-west-2"  # or your preferred region
#   profile = "ci-cd-admin-2"

# }

# data "terraform_remote_state" "current" {
#   backend = "local"
#   config = {
#     path = "terraform.tfstate"
#   }
# }

# locals {
#   resources_to_delete = [
#     for key, resource in data.terraform_remote_state.current.outputs :
#     key
#     if try(resource.tags.app-bluewind, null) != null
#   ]
# }

# resource "null_resource" "delete_tagged_resources" {
#   count = length(local.resources_to_delete)

#   triggers = {
#     resource = local.resources_to_delete[count.index]
#   }

#   provisioner "local-exec" {
#     command = "tofu destroy -target=${self.triggers.resource} -auto-approve"
#   }
# }