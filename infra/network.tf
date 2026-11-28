# ④ VPC・パブリックサブネット2つ・インターネットゲートウェイ（IGW）
# VPC は AWS の中の自分専用のネットワーク。サブネットはその中の区画。
# サブネットは無料なので、将来ロードバランサーを足せるよう2つのゾーンに作っておく。
# EC2 を置くのは a の1つだけ。

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# インターネットとの出入り口
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_subnet" "public" {
  for_each = var.public_subnets

  vpc_id            = aws_vpc.main.id
  availability_zone = each.value.az
  cidr_block        = each.value.cidr

  # ここに置いた EC2 には、自動でパブリック IP を付ける
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${each.key}"
  }
}

# 道案内の表：VPC の外（0.0.0.0/0）へ向かう通信は IGW に送る
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# 2つのサブネットに、上の道案内の表を使わせる
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}
