# source-map-report
> preview source map file in html

## Online Page
[https://cenfun.github.io/source-map-report/](https://cenfun.github.io/source-map-report/)

## Install
```sh
npm i source-map-report
```

## Usage
```js
const SMR = require('source-map-report');
SMR({
    name: "My source map report",
    outputFile: "path-to/my-report.html",
    sourcesAndMaps: {
        "source-file-name.js": "source-file-content",
        "source-file-name.js.map": "source-map-content",
        "source-file-name2.js": "source-file-content2",
        "source-file-name2.js.map": "source-map-content2"
    }
});
```
see [test/test.js](/test/test.js)
