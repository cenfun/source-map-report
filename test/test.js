const fs = require('fs');
const path = require('path');
const SMR = require('../lib');

const readFile = (p) => {
    return fs.readFileSync(path.resolve(__dirname, p), {
        encoding: 'utf-8'
    });
};

const test = () => {

    SMR({
        name: 'bootstrap report',
        sourceMaps: [readFile('map/bootstrap.bundle.js.map'), readFile('map/bootstrap.css.map')],
        outputFile: '.temp/bootstrap.html'
    });

    SMR({
        name: 'vine-ui report',
        sourceMaps: readFile('map/vine-ui-app-bundle.js.map'),
        outputFile: '.temp/vine-ui.html'
    });

};


test();
