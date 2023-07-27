echo 'nimble-core-user -D -s'
createuser nimble-core-user -D -s

echo 'createdb nimble-core-db -O nimble-core-user'
createdb nimble-core-db -O nimble-core-user

echo 'createdb nimble-core-user -O nimble-core-user'
createdb nimble-core-test -O nimble-core-user
