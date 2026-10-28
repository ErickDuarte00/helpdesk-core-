# Script que instala Docker, Swap de 2GB y crea docker-compose.yml

#!/bin/bash
set -e

# 1. Configurar 2GB de Memoria Swap para proteger la t3.micro
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# 2. Actualizar el sistema e instalar Docker + Docker Compose
apt-get update -y
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Habilitar Docker y dar permisos al usuario ubuntu
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# 3. Crear el directorio del proyecto y el docker-compose.yml corregido
mkdir -p /home/ubuntu/helpdesk
cat << 'EOF' > /home/ubuntu/helpdesk/docker-compose.yml
services:
  frontend:
    image: ghcr.io/erickduarte00/helpdesk-core--frontend:latest
    container_name: helpdesk_frontend
    restart: unless-stopped
    ports:
      - "80:4321"
    env_file:
      - .env
    depends_on:
      - backend

  backend:
    image: ghcr.io/erickduarte00/helpdesk-core--backend:latest
    container_name: helpdesk_backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
EOF

chown -R ubuntu:ubuntu /home/ubuntu/helpdesk#!/bin/bash
# Script que instala Docker, Swap de 2GB y crea docker-compose.yml
set -e

# 1. Configurar 2GB de Memoria Swap para proteger la t3.micro
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

# 2. Actualizar el sistema e instalar Docker + Docker Compose
apt-get update -y
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Habilitar Docker y dar permisos al usuario ubuntu
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# 3. Crear el directorio del proyecto y el docker-compose.yml corregido
mkdir -p /home/ubuntu/helpdesk
cat << 'EOF' > /home/ubuntu/helpdesk/docker-compose.yml
services:
  frontend:
    image: ghcr.io/erickduarte00/helpdesk-core--frontend:latest
    container_name: helpdesk_frontend
    restart: unless-stopped
    ports:
      - "80:4321"
    env_file:
      - .env
    depends_on:
      - backend

  backend:
    image: ghcr.io/erickduarte00/helpdesk-core--backend:latest
    container_name: helpdesk_backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
EOF

chown -R ubuntu:ubuntu /home/ubuntu/helpdesk