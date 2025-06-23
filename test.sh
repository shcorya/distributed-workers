for ((i = 1; i <= $2; i++ ));
do
  curl -X POST $1 -H "Content-Type: application/json" --data '{"example":"data"}'
done
