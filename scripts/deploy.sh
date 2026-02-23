#!/bin/bash
set -euo pipefail

if [ -f .env.deploy ]; then export $(grep -v '^#' .env.deploy | sed "s/['\"]//g" | xargs); fi

eval $(bash scripts/version-env.sh)
SSH_KEY_PATH=$(eval echo "$SSH_KEY")
OWNER_LC=$(echo "$GHCR_USER" | tr '[:upper:]' '[:lower:]')

API_IMAGE="ghcr.io/${OWNER_LC}/teacherhub-api:${SERVICE_TAG}"
NGINX_IMAGE="ghcr.io/${OWNER_LC}/teacherhub-api-nginx:${SERVICE_TAG}"
PG_IMAGE="postgres:16-alpine"
REDIS_IMAGE="redis:7-alpine"

echo "=== 🛡️  Iniciando Despliegue Local Inline TOTAL ==="

API_IMAGE=$API_IMAGE NGINX_IMAGE=$NGINX_IMAGE SERVICE_TAG=$SERVICE_TAG GIT_SHA=$GIT_SHA_SHORT \
docker compose -f docker-compose.prod.yml build
docker pull "$PG_IMAGE"
docker pull "$REDIS_IMAGE"

docker save "$API_IMAGE" | ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SSH_HOST" "docker load"
docker save "$NGINX_IMAGE" | ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SSH_HOST" "docker load"
docker save "$PG_IMAGE" | ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SSH_HOST" "docker load"
docker save "$REDIS_IMAGE" | ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SSH_HOST" "docker load"

cd /home/iayala/projects/astrohub-infra/infra/ansible

echo "🚀 Ejecutando Despliegue Canónico (deploy_service.yml)..."

export ANSIBLE_SSH_RETRIES=5
export ANSIBLE_HOST_KEY_CHECKING=False
export ANSIBLE_TIMEOUT=60

doppler --token "$DOPPLER_TOKEN_INFRA_DEV" run --project astrohub-infra --config dev -- \
  ansible-playbook -i inventory/hosts.ini deploy_service.yml \
    -l service_target \
    -e "target_env=dev" \
    -e "service=teacherhub-api" \
    -e "service_stack_tag=${SERVICE_TAG}" \
    -e "service_git_sha=${GIT_SHA_SHORT}" \
    -e "ansible_host=${SSH_HOST}" \
    -e "ansible_user=${SSH_USER}" \
    -e "ansible_ssh_private_key_file=${SSH_KEY_PATH}" \
    -e "letsencrypt_email=${LETSENCRYPT_EMAIL}" \
    -e "ghcr_images=teacherhub-api" \
    -e "service_domain=${SERVICE_DOMAIN}" \
    -e "service_health_path=/api/health" \
    -e "service_host_port=3005" \
    -e "service_container_port=3001" \
    -e "service_enable_postgres=true" \
    -e "service_enable_redis=true" \
    -e "service_enable_worker=false" \
    -e "service_enable_scheduler=false" \
    -e "service_enable_mongodb=false" \
    -e "service_enable_reverb=false" \
    --extra-vars "{
        \"doppler_token_service\": \"${DOPPLER_TOKEN_SERVICE}\",
        \"doppler_project\": \"teacherhub-api\",
        \"doppler_config\": \"dev\",
        \"deployment\": \"dev\",
        \"ghcr_user\": \"${OWNER_LC}\",
        \"ghcr_token\": \"none\",
        \"compose_service_app_image\": \"${API_IMAGE}\",
        \"compose_service_nginx_image\": \"${NGINX_IMAGE}\",
        \"compose_service_enable_nginx\": false,
        \"compose_service_postgres_image\": \"postgres:16-alpine\",
        \"compose_service_redis_image\": \"redis:7-alpine\",
        \"compose_service_force_recreate\": true,
        \"compose_service_remove_orphans\": true
    }" \
    -u "${SSH_USER}" \
    --private-key "${SSH_KEY_PATH}" \
    --ssh-common-args="-o ConnectTimeout=60 -o ServerAliveInterval=15 -o StrictHostKeyChecking=no" \
    -vvv
