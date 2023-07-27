module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "nimble_core_vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway         = true
  single_nat_gateway         = false
  one_nat_gateway_per_az     = true
  enable_dns_hostnames       = true
  enable_dns_support         = true
  manage_default_route_table = true
}

resource "aws_security_group" "vpc" {
  name   = "nimble_core_vpc_security_group"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
