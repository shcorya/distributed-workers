#!/bin/bash

# Usage
#   ./test.sh <host> <iterations>

for ((i = 1; i <= $2; i++ ));
do
  VAR=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
  curl -X POST $1 -H "Content-Type: application/json" --data '{"example":"'"$VAR"'"}'
done
