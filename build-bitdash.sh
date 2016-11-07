cat js/bitanalytics.js js/bitmovin-player-analytics.js > temp/bundle.js
uglifyjs --compress --source-map build/bitanalytics-bitdash.min.js.map temp/bundle.js > build/bitanalytics-bitdash.min.js
