set -e

REMOTE="cx_vision2"
IMAGE_STORE="/home/cxdev"
DEPLOY_PATH="/opt/sspc"

VERSION=$(node -p "require('./packages/queue/package.json').version")

echo "1. Coping queue:$VERSION to server..."
rsync -avP ./build/sspc-queue:$VERSION.tar $REMOTE:$REMOVE_STORE

echo "2. Loading Docker image on server..."
ssh $REMOTE "sudo docker load -i $IMAGE_STORE/sspc-queue:$VERSION.tar"

# echo "3. Update docker-compose.yml manually if needed, then press Enter to continue..."
# read -r
# rsync -avP ./docker-compose.yml $REMOTE:$DEPLOY_PATH/docker-compose.yml

echo "4. Compose up queue:$VERSION on server..."
# ssh $REMOTE "cd $DEPLOY_PATH && sudo docker compose down queue && sudo docker compose up queue -d"

echo "5. Logging..."
# sleep 5
# ssh $REMOTE "cd $DEPLOY_PATH && sudo docker compose logs -f queue"
