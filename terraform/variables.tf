// Variables reutilizables (región, tipo de instancia, llave SSH)

variable "aws_region" {
  description = "Región de AWS donde se desplegará la infraestructura"
  type        = string
  default     = "us-east-2"
}

variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.micro"
}

variable "helpdesk-ec2-key" {
  description = "Nombre del Key Pair (par de claves SSH) que ya existe en tu cuenta de AWS EC2"
  type        = string
  default     = "helpdesk-ec2-key" 
}

