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
        outputFile: '.temp/bootstrap.html',
        sourcesAndMaps: {
            'bootstrap.css': readFile('map/bootstrap.css'),
            'bootstrap.css.map': readFile('map/bootstrap.css.map'),

            'bootstrap.min.css': readFile('map/bootstrap.min.css'),
            'bootstrap.min.css.map': readFile('map/bootstrap.min.css.map'),

            'bootstrap.js': readFile('map/bootstrap.js'),
            'bootstrap.js.map': readFile('map/bootstrap.js.map'),

            'bootstrap.min.js': readFile('map/bootstrap.min.js'),
            'bootstrap.min.js.map': readFile('map/bootstrap.min.js.map'),

            'popper.min.js': readFile('map/popper.min.js'),
            'popper.min.js.map': readFile('map/popper.min.js.map')
        }
    });

    SMR({
        name: 'jquery report',
        outputFile: '.temp/jquery.html',
        sourcesAndMaps: {
            'jquery.js': readFile('map/jquery.js'),
            'jquery.min.js': readFile('map/jquery.min.js'),
            'jquery.min.map': readFile('map/jquery.min.map')
        }
    });

};


test();
