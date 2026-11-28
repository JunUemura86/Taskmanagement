# ⑦ EC2 の IP とアプリの URL
# terraform apply が終わると表示される。あとから terraform output でも見られる。
# 注意：EC2 を作り直すと IP は変わる。

output "public_ip" {
  description = "EC2 のパブリック IP アドレス"
  value       = aws_instance.app.public_ip
}

output "app_url" {
  description = "アプリの URL（自宅の IP からだけ開ける）"
  value       = "http://${aws_instance.app.public_ip}"
}

output "instance_id" {
  description = "EC2 のインスタンス ID"
  value       = aws_instance.app.id
}

output "ssm_session_command" {
  description = "Session Manager で EC2 に入るコマンド（Session Manager プラグインが必要）"
  value       = "aws ssm start-session --target ${aws_instance.app.id} --profile ${var.aws_profile} --region ${var.region}"
}
