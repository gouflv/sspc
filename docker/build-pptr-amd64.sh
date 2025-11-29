set -e

BUILDER_NAME="sspc-builder"
VERSION=$(node -p "require('./packages/pptr/package.json').version")

if ! docker buildx ls | grep -q "$BUILDER_NAME"; then
  echo "🔧 Creating buildx builder: $BUILDER_NAME"
  docker buildx create --name "$BUILDER_NAME" --use --driver docker-container
  docker buildx inspect --bootstrap
else
  docker buildx use "$BUILDER_NAME"
fi

docker buildx build \
  --platform linux/amd64 \
  -t gouflv/sspc-pptr:$VERSION \
  --target pptr-bundle \
  --output type=docker,dest=./build/sspc-pptr:$VERSION.tar \
  .