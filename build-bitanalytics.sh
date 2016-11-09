mkdir temp
cat js/bitanalytics-core.js js/bitanalytics-bitmovin.js > temp/bundle.js
uglifyjs --compress --source-map build/bitanalytics.min.js.map temp/bundle.js > build/bitanalytics.min.js
rm -r temp
