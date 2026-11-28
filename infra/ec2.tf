# ⑥ EC2（t4g.micro・Amazon Linux 2023）
#
# Java について：EC2 には Java を直接入れない。
# EC2 に入れるのは Docker と Git だけで、Java（Spring Boot）・PostgreSQL・nginx は
# Docker のコンテナの中で動かす。Java はバックエンドのコンテナイメージに含まれる。

# Amazon Linux 2023（arm64 版）の最新の AMI を、AWS が公開しているパラメータから取る
data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

# --- Session Manager で EC2 に入るための IAM ロール ---

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "${var.project_name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# --- EC2 本体 ---

resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023_arm64.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public["a"].id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  # ディスク：20GB・gp3・暗号化あり
  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  # インスタンスの情報を読む仕組み（IMDS）は、安全な v2 だけを使う
  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }

  # 起動したときに1回だけ実行するスクリプト（スワップ・Docker・Git・clone・起動）
  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    repo_url     = var.repo_url
    repo_branch  = var.repo_branch
    compose_file = var.compose_file
  })

  # スクリプトを書き換えたら、EC2 を作り直して新しいスクリプトで起動する
  user_data_replace_on_change = true

  # AMI が新しくなっても、勝手に作り直さない（作り直すのは自分で決める）
  lifecycle {
    ignore_changes = [ami]
  }

  tags = {
    Name = "${var.project_name}-app"
  }
}
