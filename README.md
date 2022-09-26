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
    sourceMap: "raw source map string",
    outputFile: "path-to/report.html"
});
```
see [scripts/test.js](/scripts/test.js)
