#!/bin/bash

# Quick script to create Supabase storage bucket from terminal
# Usage: ./create-bucket.sh YOUR_SERVICE_ROLE_KEY

SUPABASE_URL="https://wiudrzdkbpyziaodqoog.supabase.co"
SERVICE_ROLE_KEY="${1}"

if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Service Role Key required"
  echo ""
  echo "Usage: ./create-bucket.sh YOUR_SERVICE_ROLE_KEY"
  echo ""
  echo "To get your Service Role Key:"
  echo "1. Go to: https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/settings/api"
  echo "2. Copy the 'service_role' key (NOT the anon key)"
  echo ""
  exit 1
fi

BUCKET_NAME="lesson-pdfs"

echo "🔍 Checking if bucket exists..."

# Check if bucket exists
RESPONSE=$(curl -s -X GET \
  "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "apikey: ${SERVICE_ROLE_KEY}")

# Check if bucket already exists
if echo "$RESPONSE" | grep -q "\"name\":\"${BUCKET_NAME}\""; then
  echo "✅ Bucket '${BUCKET_NAME}' already exists!"
  exit 0
fi

echo "📦 Creating bucket '${BUCKET_NAME}'..."

# Create the bucket
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${BUCKET_NAME}\",
    \"public\": true,
    \"file_size_limit\": 52428800,
    \"allowed_mime_types\": [\"application/pdf\"]
  }")

# Check for errors
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Error creating bucket:"
  echo "$RESPONSE" | grep -o '"message":"[^"]*"' | head -1
  echo ""
  echo "💡 Try creating it manually:"
  echo "   https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets"
  exit 1
fi

echo "✅ Bucket '${BUCKET_NAME}' created successfully!"
echo ""
echo "📋 Configuration:"
echo "   - Name: ${BUCKET_NAME}"
echo "   - Public: Yes"
echo "   - File size limit: 50 MB"
echo "   - Allowed MIME types: application/pdf"
echo ""
echo "🎉 PDF sharing feature is now ready!"

