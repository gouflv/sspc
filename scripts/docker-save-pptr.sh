export VERSION=$(node -p "require('./packages/pptr/package.json').version")
mkdir build
echo "Saving docker image gouflv/sspc-pptr:$VERSION"
docker save gouflv/sspc-pptr:$VERSION | gzip > build/pptr-$VERSION.tar.gz