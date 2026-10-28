# Muestra la IP Elástica final en la terminal

output "elastic_ip" {
  description = "IP Elastica fija del servidor Helpdesk"
  value       = aws_eip.helpdesk_eip.public_ip
}

output "frontend_url" {
  description = "URL para abrir el sistema en el navegador"
  value       = "http://${aws_eip.helpdesk_eip.public_ip}"
}

output "backend_api_url" {
  description = "Valor que debes colocar en PUBLIC_API_URL"
  value       = "http://${aws_eip.helpdesk_eip.public_ip}:3000/api"
}