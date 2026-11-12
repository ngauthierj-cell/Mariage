#!/usr/bin/env bash
# Applique les migrations sur un Postgres local jetable et lance les tests pgTAP.
# Prérequis : Postgres 16+ (initdb, pg_ctl), pgTAP et pg_prove.
# Usage : npm run db:test
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
WORK="${PGTEST_DIR:-/tmp/mariage-pgtest}"
PORT="${PGTEST_PORT:-54329}"

# Postgres refuse de tourner en root : on délègue à l'utilisateur postgres.
RUN=()
if [ "$(id -u)" = "0" ]; then RUN=(runuser -u postgres --); fi

cleanup() { "${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; }
trap cleanup EXIT

rm -rf "$WORK" && mkdir -p "$WORK"
[ "$(id -u)" = "0" ] && chown postgres "$WORK"
"${RUN[@]}" "$PGBIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses='' -c wal_level=logical" -l "$WORK/log" start >/dev/null

export PGHOST="$WORK" PGPORT="$PORT" PGUSER=postgres
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d postgres)

"${PSQL[@]}" -f "$ROOT/scripts/db/supabase-shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migration $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

echo "→ tests pgTAP"
pg_prove -d postgres --ext .sql "$ROOT"/supabase/tests/*.sql
