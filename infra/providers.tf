# ① AWS のプロバイダー設定
# Terraform 本体と AWS プロバイダー（AWS を操作するためのプラグイン）のバージョンを決め、
# どの AWS アカウント・リージョンに作るかを指定する。

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0" # 6.x の範囲で使う（7.0 以降に勝手に上がらない）
    }
  }

  # state（Terraform が「何を作ったか」を覚えておく記録）は、手元の infra/terraform.tfstate に置く。
  # backend を書かなければ、手元に置かれる。.gitignore に入っているので GitHub には上がらない。
  # 注意：AWS に何かがある間は terraform.tfstate を消さない（消すと Terraform で destroy できなくなる）。
  # あとで S3 に移すときは、ここに backend "s3" { ... } を書いて terraform init -migrate-state を実行する。
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile

  # このアカウント以外で実行しようとしたら、何も作らずに止める（誤ったアカウントでの事故を防ぐ）
  allowed_account_ids = [var.allowed_account_id]

  # 作るものすべてに同じタグを付け、AWS 上で「このアプリのもの」と分かるようにする
  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
    }
  }
}
