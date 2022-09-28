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
    sourceMaps: ["raw source map string 1", "raw source map string 2"],
    outputFile: "path-to/my-report.html"
});
```
see [scripts/test.js](/scripts/test.js)
