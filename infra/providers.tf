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

  # state（Terraform が「何を作ったか」を覚えておく記録）は S3 に置く。
  # バケット名にはアカウント番号が入るので、ここには書かず、
  # 公開しないファイル backend.hcl から読み込む（見本は backend.hcl.example）。
  #   terraform init -backend-config=backend.hcl
  backend "s3" {}
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
