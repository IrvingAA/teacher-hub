# Makefile Profesional IrvingAA (Unified Flow)
.PHONY: test deploy generate-secrets

test:
	@echo "🧪 Ejecutando integridad local..."
	docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from app-test --remove-orphans
	docker compose -f docker-compose.test.yml down -v

deploy:
	@echo "🚀 Iniciando Ciclo de Despliegue (Build -> Inject -> Ansible)..."
	@chmod +x scripts/*.sh
	./scripts/deploy.sh

generate-secrets:
	@chmod +x scripts/*.sh
	@./scripts/generate-secrets.sh
