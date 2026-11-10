#!/bin/sh
set -eu
cd /docker/nex-sourcify-testing
umask 077

# Keep generated secrets on the VPS and preserve them on subsequent deployments.
python3 - <<'PY'
from pathlib import Path
import secrets

environment = Path('.env')
if not environment.exists():
    values = {
        'TEST_DB_PASSWORD': secrets.token_hex(32),
        'TEST_JWT_SECRET': secrets.token_hex(48),
        'TEST_ADMIN_PASSWORD': secrets.token_hex(16),
    }
    with environment.open('x') as output:
        output.write(''.join(f'{key}={value}\n' for key, value in values.items()))
    environment.chmod(0o600)
    with Path('.testing-server-credentials.txt').open('x') as output:
        output.write('Sourcify testing and training\n')
        output.write('URL: http://200.234.33.89:8000\n')
        output.write('User ID: trainingadmin\n')
        output.write(f'Password: {values["TEST_ADMIN_PASSWORD"]}\n')
    Path('.testing-server-credentials.txt').chmod(0o600)
    print('Independent testing secrets and training login generated.')
else:
    print('Preserving existing testing secrets and training login.')
PY

docker compose -f docker-compose.testing.yml config --quiet
docker compose -f docker-compose.testing.yml build setup app
docker compose -f docker-compose.testing.yml up -d
docker compose -f docker-compose.testing.yml ps -a
