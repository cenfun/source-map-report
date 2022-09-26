const fs = require('fs');
const path = require('path');
const SMR = require('../lib');

const test = () => {

    const maps = [
        {
            sourceMapPath: '../../webpack-stats-report/dist/webpack-stats-report.js.map',
            outputFile: '.temp/webpack-stats-report.html'
        },
        {
            sourceMapPath: '../node_modules/turbogrid/dist/turbogrid.js.map',
            outputFile: '.temp/turbogrid.html'
        }
    ];

    for (const item of maps) {

        item.sourceMap = fs.readFileSync(path.resolve(__dirname, item.sourceMapPath), {
            encoding: 'utf-8'
        });

        SMR(item);
    }
};


test();
