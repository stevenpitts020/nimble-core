module "eks" {
  source = "terraform-aws-modules/eks/aws"

  cluster_name                   = "nimble_core_cluster"
  cluster_version                = "1.21"
  cluster_endpoint_public_access = true

  cluster_addons = {
    vpc-cni = {
      resolve_conflicts = "OVERWRITE"
    }
  }

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_group_defaults = {
    ami_type       = "AL2_x86_64"
    disk_size      = 50
    instance_types = ["t3.large"]
  }

  eks_managed_node_groups = {
    ng1 = {
      min_size     = 1
      max_size     = 10
      desired_size = 1

      capacity_type = "SPOT"
    }
  }
}


// AL2_x86_64
