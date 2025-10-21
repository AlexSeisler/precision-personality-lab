#!/usr/bin/env bash
# Precision Personality Lab – Simple Integration Tests
set -e

API_ROOT="http://localhost:3000/api"

# --- Auth info (replace values) ---
JWT="eyJhbGciOiJIUzI1NiIsImtpZCI6IkdDZm1qbnJ6YUFkWlNDbmoiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3N5Y2h4eGVlYnR5eHhjYWFwZnFnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhMDRjNzJkZS1hNGJjLTQxZTgtOWRiMC0zNTFmMTdjZTI2MjciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYxMDY5ODAyLCJpYXQiOjE3NjEwNjYyMDIsImVtYWlsIjoiYXNlaXNsZXI3MDQ1QHN0ZXZlbnNjb2xsZWdlLmVkdSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJhc2Vpc2xlcjcwNDVAc3RldmVuc2NvbGxlZ2UuZWR1IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiYTA0YzcyZGUtYTRiYy00MWU4LTlkYjAtMzUxZjE3Y2UyNjI3In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib3RwIiwidGltZXN0YW1wIjoxNzYxMDY2MjAyfV0sInNlc3Npb25faWQiOiI2ODdmNjc2My02ZDcwLTQ0YTYtOTUwNi0yNWEwMTZiZDgyMjkiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.3nFuOzYUAgSsZ9hqKaVneSLgppEj-o_W_qIrPYQNMJc"
CALIBRATION_ID="b93ec7be-1312-4ed8-9f66-fa6c9c357863"
USER_ID="a04c72de-a4bc-41e8-9db0-351f17ce2627"


echo ""
echo "🔹 Testing /api/health ..."
curl -s -X GET "$API_ROOT/health"

echo "🔹 Testing /api/generate ..."
curl -s -X POST "$API_ROOT/generate" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"Explain how Retrieval-Augmented Generation (RAG) pipelines combine retrieval and generation.\",\"calibrationId\":\"$CALIBRATION_ID\"}"


#echo "🔹 Testing /api/analytics ..."
#curl -s -X GET "$API_ROOT/analytics?user_id=$USER_ID" \
  #-H "Authorization: Bearer $JWT"
