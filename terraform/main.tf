// Proveedor AWS, AMI de Ubuntu, EC2, Security Group e IP Elástica

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Obtener automáticamente la imagen más reciente de Ubuntu 24.04 LTS
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (creador oficial de Ubuntu)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# 1. Security Group con reglas de Entrada (Inbound) y Salida (Outbound)
resource "aws_security_group" "helpdesk_sg" {
  name        = "helpdesk-production-sg"
  description = "Permite SSH, HTTP, HTTPS y Backend API en puerto 3000"

  # SSH (Puerto 22)
  ingress {
    description = "SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Frontend HTTP (Puerto 80)
  ingress {
    description = "HTTP Frontend"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS (Puerto 443)
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend Express API (Puerto 3000)
  ingress {
    description = "Backend API Port 3000"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Grafana Dashboard (Puerto 3001)
  ingress {
    description = "Grafana Web Dashboard"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # REGLA CRÍTICA DE SALIDA (Outbound): Permite descargar imágenes de ghcr.io y conectar a Supabase
  egress {
    description = "Permitir todo el trafico saliente"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "helpdesk-sg"
  }
}

# 2. Instancia EC2 (t3.micro)
resource "aws_instance" "helpdesk_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  #key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.helpdesk_sg.id]

  # Script de inicialización automática (Swap + Docker + Compose)
  user_data = replace(file("${path.module}/user_data.sh"), "\r\n", "\n")

  root_block_device {
    volume_size = 20 # 20 GB (dentro de la capa gratuita de AWS que da hasta 30 GB)
    volume_type = "gp3"
  }

  tags = {
    Name = "helpdesk-server-tf"
  }
}

# 3. Dirección IP Elástica (Fija) y su asociación a la instancia
resource "aws_eip" "helpdesk_eip" {
  domain = "vpc"

  tags = {
    Name = "helpdesk-elastic-ip"
  }
}

resource "aws_eip_association" "eip_assoc" {
  instance_id   = aws_instance.helpdesk_server.id
  allocation_id = aws_eip.helpdesk_eip.id
}