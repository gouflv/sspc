set -e

REMOTE="cx_vision2"
IMAGE_STORE="/home/cxdev"
DEPLOY_PATH="/opt/sspc"

VERSION=$(node -p "require('./packages/pptr/package.json').version")

echo "1. Coping pptr:$VERSION to server..."
rsync -avP ./build/sspc-pptr:$VERSION-bundle.tar $REMOTE:$IMAGE_STORE

echo "2. Loading Docker image on server..."
ssh $REMOTE "sudo docker load -i $IMAGE_STORE/sspc-pptr:$VERSION-bundle.tar"

echo "3. Update docker-compose.yml manually if needed, then press Enter to continue..."
read -r
rsync -avP ./docker-compose.yml $REMOTE:$DEPLOY_PATH/docker-compose.yml

echo "4. Compose up pptr:$VERSION on server..."
ssh $REMOTE "cd $DEPLOY_PATH && sudo docker compose down pptr && sudo docker compose up pptr -d"

echo "5. Logging..."
sleep 5
ssh $REMOTE "cd $DEPLOY_PATH && sudo docker compose logs -f pptr"
