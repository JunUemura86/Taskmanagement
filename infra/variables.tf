# ② リージョンとプロジェクト名

variable "region" {
  description = "AWS のリージョン（東京）"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "プロジェクト名。リソースの名前とタグに使う"
  type        = string
  default     = "taskmanagement"
}

variable "aws_profile" {
  description = "AWS CLI のプロファイル名（aws configure sso で作ったもの）"
  type        = string
  default     = "taskmanagement"
}

# ③ 変数値
# 初期値（default）がない変数は、公開しない terraform.tfvars に値を書く。
# 見本は terraform.tfvars.example。

variable "allowed_account_id" {
  description = "Terraform を実行してよい AWS アカウントの番号（12桁）。公開しない"
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.allowed_account_id))
    error_message = "アカウント番号は12桁の数字で指定してください。"
  }
}

variable "my_ip_cidr" {
  description = "アプリを開いてよい自宅の IP アドレス（例：203.0.113.10/32）。公開しない"
  type        = string

  validation {
    condition     = can(cidrhost(var.my_ip_cidr, 0))
    error_message = "203.0.113.10/32 のような CIDR の形で指定してください。"
  }
}

variable "instance_type" {
  description = "EC2 の種類。t4g.micro は arm64（Graviton）・メモリ 1GB"
  type        = string
  default     = "t4g.micro"
}

variable "vpc_cidr" {
  description = "VPC の IP アドレスの範囲"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "パブリックサブネット（アベイラビリティゾーンごとに1つ）"
  type = map(object({
    az   = string
    cidr = string
  }))
  default = {
    a = { az = "ap-northeast-1a", cidr = "10.0.1.0/24" }
    c = { az = "ap-northeast-1c", cidr = "10.0.2.0/24" }
  }
}

variable "ssh_public_key_path" {
  description = "EC2 に登録する SSH の公開鍵（.pub）の場所。秘密鍵（.pub なし）は Mac にだけ置く"
  type        = string
  default     = "~/.ssh/taskmanagement_ed25519.pub"
}

variable "ssh_private_key_path" {
  description = "SSH の秘密鍵の場所（接続コマンドの表示に使うだけ。Terraform は中身を読まない）"
  type        = string
  default     = "~/.ssh/taskmanagement_ed25519"
}

variable "root_volume_size" {
  description = "EC2 のディスクの大きさ（GB）"
  type        = number
  default     = 20
}

variable "repo_url" {
  description = "EC2 が起動時に clone する GitHub リポジトリ（公開）"
  type        = string
  default     = "https://github.com/JunUemura86/Taskmanagement.git"
}

variable "repo_branch" {
  description = "clone するブランチ"
  type        = string
  default     = "main"
}

variable "compose_file" {
  description = "本番用の Docker Compose ファイル（ロードマップの段階1で作る）"
  type        = string
  default     = "docker-compose.prod.yml"
}
