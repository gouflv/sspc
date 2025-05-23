export VERSION=$(node -p "require('./packages/pptr/package.json').version")
docker build --platform linux/amd64 -t gouflv/sspc-pptr:$VERSION-bundle --target pptr-bundle .