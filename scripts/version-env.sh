#!/bin/bash
set -euo pipefail

SERVICE_NAME="teacherhub-api"
OWNER="${GHCR_USER:-IrvingAA}"
REF_NAME="$(git rev-parse --abbrev-ref HEAD)"
GIT_SHA="$(git rev-parse HEAD)"
OWNER_LC="$(echo "${OWNER}" | tr '[:upper:]' '[:lower:]')"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
SHORT_SHA="${GIT_SHA:0:7}"

if [ "${REF_NAME}" = "develop" ]; then
  VERSION="dev-${SHORT_SHA}-${TIMESTAMP}"
elif [ "${REF_NAME}" = "main" ]; then
  VERSION="main-${SHORT_SHA}-${TIMESTAMP}"
else
  VERSION="${REF_NAME}-${SHORT_SHA}-${TIMESTAMP}"
fi

echo "OWNER_LC=${OWNER_LC}"
echo "SERVICE_NAME=${SERVICE_NAME}"
echo "SERVICE_TAG=${VERSION}"
echo "GIT_SHA_SHORT=${SHORT_SHA}"
