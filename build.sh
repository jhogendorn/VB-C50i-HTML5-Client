#!/bin/bash
coffee -bj ./js/camera.js -c ./js/camera.coffee
rm ./css/style.css
lessc ./css/style.less >> ./css/style.css
CSS=`cat css/style.css css/mint-choc/jquery-ui-1.8.16.custom.css | yuicompressor --type css`
HOME=`pwd`
cd css/mint-choc
for f in $(find images -type f);
do
	MIME=`file --mime-type -b $f`
	BASE64=`base64 $f`
	CSS=`echo $CSS | sed "s@url($f)@url(data:$MIME;base64,$BASE64)@g"`
done

cd $HOME
if [ ! -d "build" ]; then
	mkdir build
	echo "Creating Build Directory"
fi

echo "Building in $HOME"
rm -r ./build/*
cp index.html ./build/
mkdir -p build/js/libs
cp js/*.js build/js
cp js/libs/*.js build/js/libs
sed -i "" -e "s@<style></style>@<style>$CSS</style>@g" ./build/index.html

#osascript ~/bin/chrome-reloadcss.scpt CamClient
