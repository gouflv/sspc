export VERSION=$(node -p "require('./packages/queue/package.json').version")
docker build --platform linux/amd64 -t gouflv/sspc-queue:$VERSION --target queue .