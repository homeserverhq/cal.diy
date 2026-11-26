#!/bin/sh
set -x

# Replace the statically built BUILT_NEXT_PUBLIC_WEBAPP_URL with run-time NEXT_PUBLIC_WEBAPP_URL
# NOTE: if these values are the same, this will be skipped.
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_WEBAPP_URL" "$NEXT_PUBLIC_WEBAPP_URL"

# Replace the statically built VAPID placeholder with the run-time public key
scripts/replace-placeholder.sh "__CALDIY_VAPID_PUBLIC_KEY__" "${NEXT_PUBLIC_VAPID_PUBLIC_KEY:-}"

# Replace statically built NEXT_PUBLIC_* placeholders with run-time values
scripts/replace-placeholder.sh "__CALDIY_APP_NAME__" "${NEXT_PUBLIC_APP_NAME:-Cal.diy}"
scripts/replace-placeholder.sh "__CALDIY_COMPANY_NAME__" "${NEXT_PUBLIC_COMPANY_NAME:-Cal.com, Inc.}"
scripts/replace-placeholder.sh "__CALDIY_SUPPORT_EMAIL__" "${NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS:-help@cal.com}"
scripts/replace-placeholder.sh "__CALDIY_TERMS_URL__" "${NEXT_PUBLIC_WEBSITE_TERMS_URL:-https://cal.com/terms}"
scripts/replace-placeholder.sh "__CALDIY_PRIVACY_URL__" "${NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL:-https://cal.com/privacy}"
scripts/replace-placeholder.sh "__CALDIY_DISABLE_SIGNUP__" "${NEXT_PUBLIC_DISABLE_SIGNUP:-}"
scripts/replace-placeholder.sh "__CALDIY_MINUTES_TO_BOOK__" "${NEXT_PUBLIC_MINUTES_TO_BOOK:-5}"

scripts/wait-for-it.sh ${DATABASE_HOST} -- echo "database is up"
npx prisma migrate deploy --schema /calcom/packages/prisma/schema.prisma
npx ts-node --transpile-only /calcom/scripts/seed-app-store.ts
yarn start
