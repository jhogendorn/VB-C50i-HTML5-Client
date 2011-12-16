#!/bin/zsh
coffee -bj ./js/camera.js -c ./js/camera.coffee
rm ./css/style.css
lessc ./css/style.less >> ./css/style.css
#cat default.css > combined.css && lessc combined.less >> combined.css
#yuicompressor --type css -o combined-min.css combined.css
osascript ~/bin/chrome-reloadcss.scpt CamClient
