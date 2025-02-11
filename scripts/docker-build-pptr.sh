export VERSION=$(node -p "require('./packages/pptr/package.json').version")
docker build --platform linux/amd64 -t sspc/pptr:$VERSION --target pptr .