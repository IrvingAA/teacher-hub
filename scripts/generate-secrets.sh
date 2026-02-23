#!/bin/sh

echo "--- Generando Secretos SOT Compliant ---"

DB_PASS=$(openssl rand -base64 24)
MASTER_KEY="thk_$(openssl rand -hex 8).$(openssl rand -hex 24)"
JWT_SEC=$(openssl rand -base64 32)

echo "Postgres Password: $DB_PASS"
echo "Bootstrap API Key: $MASTER_KEY"
echo "JWT Secret:        $JWT_SEC"

echo ""
echo "⚠️  Copia estos valores a tu .env.deploy o Doppler de inmediato."
