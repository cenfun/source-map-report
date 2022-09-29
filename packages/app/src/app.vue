<template>
  <VuiFlex
    direction="column"
    class="vui-app"
  >
    <div class="vui-header vui-flex-row">
      <VuiFlex
        spacing="10px"
        width="100%"
      >
        <div
          class="vui-title"
          tooltip="Lightweight UI components"
        >
          {{ state.name }}
        </div>
        <div class="vui-upload">
          <input
            type="file"
            multiple
            @change="onUpload"
          >
        </div>
        <div class="vui-flex-auto" />
        <div>
          <a
            href="https://github.com/cenfun/source-map-report"
            target="_blank"
            class="vui-icon vui-icon-github"
            tooltip="Source Map Report"
          />
        </div>
      </VuiFlex>
    </div>
    <div class="vui-filter">
      <VuiFlex spacing="10px">
        <div><b>Filter:</b></div>
        <VuiInput
          v-model="state.keywords"
          name="name"
          placeholder="Name"
          width="200px"
        />
        <div class="vui-flex-empty" />
        <VuiSwitch
          v-model="state.group"
          label="Group by Path"
        />
      </VuiFlex>
    </div>
    <div class="vui-body vui-flex-auto">
      <div class="vui-grid" />
      <div
        v-if="!state.sourcesAndMaps"
        class="vui-no-report-data"
      >
        <span>Please select source(s) and map(s)</span>
        <input
          type="file"
          multiple
          @change="onUpload"
        >
      </div>
    </div>
    <VuiFlyover
      :visible="state.flyoverVisible"
      width="80%"
      position="right"
    >
      <div class="vui-flyover-main vui-flex-column">
        <div class="vui-flyover-header">
          <VuiFlex spacing="10px">
            <div
              class="vui-flyover-icon"
              @click="state.flyoverVisible=false"
            >
              <div class="vui-icon vui-icon-arrow-right" />
            </div>
            <div class="vui-flyover-title vui-flex-auto">
              {{ state.currentFile }}
            </div>
            <div
              class="vui-flyover-icon"
              @click="state.flyoverVisible=false"
            >
              <div class="vui-icon vui-icon-close" />
            </div>
          </VuiFlex>
        </div>
        <div class="vui-flyover-content vui-flex-auto">
          <VuiFlex
            height="100%"
          >
            <div
              ref="currentCodes"
              class="vui-codes vui-current-codes"
            />
            <div class="vui-codes">
              <code>{{ state.currentCodes }}</code>
            </div>
          </VuiFlex>
        </div>
      </div>
    </VuiFlyover>
  </VuiFlex>
</template>
<script setup>
import VineUI from 'vine-ui';
import { Grid } from 'turbogrid';
//import Prism from 'prismjs';
import 'prismjs/themes/prism.min.css';
import {
    onMounted, shallowReactive, watch, ref
} from 'vue';

import decompress from 'lz-utils/lib/decompress.js';
import { BF } from './util/util.js';
import Consumer from './util/consumer.js';

const {
    VuiFlex, VuiInput, VuiSwitch, VuiFlyover
} = VineUI;

const state = shallowReactive({
    name: 'Source Map Report',
    sourcesAndMaps: null,
    consumers: null,
    sourceFiles: null,
    grid: null,
    group: false,
    keywords: '',
    flyoverVisible: false,
    currentFile: '',
    currentCodes: ''
});

const currentCodes = ref(null);

// const highlight = (codes) => {
//     if (!codes) {
//         return '';
//     }
//     const lang = Prism.languages.javascript;
//     return Prism.highlight(codes, lang);
// };

const isMatch = (value, list, rowData, matchedKey) => {
    for (let i = 0, l = list.length; i < l; i++) {
        const k = list[i];
        const index = value.indexOf(k);
        if (index !== -1) {
            rowData[matchedKey] = {
                index: index,
                length: k.length
            };
            return true;
        }
    }
    return false;
};

const filterHandler = (rowItem) => {
    const matchedKey = 'name_matched';
    rowItem[matchedKey] = null;

    const ks = state.keywords;
    if (!ks) {
        return true;
    }

    const list = ks.trim().toLowerCase().split(/\s+/g).filter((item) => item);
    if (!list.length) {
        return true;
    }
    const v = rowItem.name;
    if (typeof v === 'undefined') {
        return false;
    }
    const value = `${v}`.toLowerCase();
    if (isMatch(value, list, rowItem, matchedKey)) {
        return true;
    }

    return false;

};

const showFlyover = (rowData, force) => {

    if (!rowData.codes) {
        return;
    }

    if (!state.flyoverVisible && !force) {
        return;
    }

    state.flyoverVisible = true;

    state.currentFile = rowData.name;
    state.currentCodes = rowData.codes;

    if (rowData.type === 'original') {
        const consumer = state.consumers[rowData.tg_parent.index];
        console.log(consumer);


        return;
    }

    //generated

    const consumer = state.consumers[rowData.index];
    console.log(consumer);

    //currentCodes.value.innerHTML = highlight();

};

const createGrid = () => {

    const grid = new Grid('.vui-grid');

    grid.bind('onClick', (e, d) => {
        if (!d.rowNode) {
            return;
        }
        const rowItem = d.rowItem;

        let openFlyover = false;
        const icon = d.e.target;
        if (icon.classList.contains('tg-flyover-icon')) {
            openFlyover = true;
        }
        showFlyover(rowItem, openFlyover);

        grid.setRowSelected(rowItem, d.e);

    });

    grid.bind('onDblClick', (e, d) => {
        if (!d.rowNode) {
            return;
        }
        const rowItem = d.rowItem;
        showFlyover(rowItem, true);
    });

    //grid.bind('onUpdated', () => {
    //updateFilterInfo(gridName);
    //});

    grid.setOption({
        //textSelectable: true,
        //frozenRow: 0,
        sortField: 'size',
        sortAsc: false,
        sortOnInit: true,
        selectMultiple: false,
        rowHeight: 27,
        rowNumberVisible: true,
        rowNumberWidth: 50,
        rowNotFound: '<div>No Results</div>',
        rowFilter: (rowItem) => {
            return filterHandler(rowItem);
        },
        bindWindowResize: true,
        bindContainerResize: true
    });

    grid.setFormatter({

        null: function(v) {
            return v;
        },

        string: function(v, rd, cd) {
            const id = cd.id;
            const color = rd[`${id}_color`];
            if (color) {
                v = `<span style="color:${color};">${v}</span>`;
            }
            return v;
        },

        tree: function(v, rd, cd, node) {
            const df = this.getDefaultFormatter('tree');

            const nm = rd.name_matched;
            if (nm) {
                const left = v.substring(0, nm.index);
                const mid = v.substr(nm.index, nm.length);
                const right = v.substr(nm.index + nm.length);
                v = `${left}<b class="color-match">${mid}</b>${right}`;
            }

            if (rd.name_color) {
                v = `<span style="color:${rd.name_color};">${v}</span>`;
            }

            if (rd.codes) {
                v += `
                <div class="tg-cell-hover-icon tg-flyover-icon" title="Click to show module detail">
                    <div class="vui-icon vui-icon-info" />
                </div>
            `;
            }
            return df(v, rd, cd, node);
        },

        rowNumber: function(v, rd) {
            const n = rd.tg_list_index + 1;
            if (rd.tg_group) {
                return `${n}.`;
            }
            return n;
        },

        codes: function(v, rd) {
            const icon = rd.codes ? 'passed' : 'failed';
            return `<div class="vui-icon vui-icon-${icon}"></div>`;
        },

        size: function(v, rd, cd) {
            if (!Number.isInteger(v)) {
                return v;
            }
            v = BF(v);
            return this.getFormatter('string')(v, rd, cd);
        },

        percent: function(v) {
            if (!v) {
                return '';
            }
            return `${v}%`;
        },
        percentBar: function(v) {
            if (!v) {
                return '';
            }
            return `<div class="vui-percent" style="background:linear-gradient(to right, #999 ${v}%, #fff ${v}%);"></div>`;
        }
    });

    return grid;

};

const getGridRows = () => {

    const consumers = state.consumers;
    const sourceFiles = state.sourceFiles;

    let rowsSize = 0;

    const rows = consumers.map((consumer, gi) => {

        //console.log(consumer);
        const row = {
            index: gi,
            name: consumer.file,
            type: 'generated'
        };

        const rowCodes = sourceFiles[row.name];
        if (rowCodes) {
            row.size = rowCodes.length;
            rowsSize += row.size;
            row.codes = rowCodes;
        }

        let subsSize = 0;
        const subs = consumer.sources.map((it, oi) => {
            let subCodes = consumer.sourceContentFor(it);
            if (!subCodes) {
                subCodes = sourceFiles[it];
            }

            if (!subCodes) {
                return {
                    index: oi,
                    name: it,
                    type: 'original'
                };
            }

            const size = subCodes.length;
            subsSize += size;
            return {
                index: oi,
                name: it,
                size,
                codes: subCodes,
                type: 'original'
            };

        });

        if (subsSize && subs.length > 1) {
            subs.forEach((sub) => {
                if (sub.codes) {
                    sub.percent = (sub.size / subsSize * 100).toFixed(2);
                }
            });
        }

        //append row subs
        row.subs = subs;

        return row;

    });

    if (rowsSize && rows.length > 1) {
        rows.forEach((row) => {
            if (row.codes) {
                row.percent = (row.size / rowsSize * 100).toFixed(2);
            }
        });
    }

    return rows;

};

const getGridColumns = () => {
    const columns = [{
        id: 'name',
        name: 'Name',
        width: 500,
        maxWidth: 2048
    }, {
        id: 'codes',
        name: 'Codes',
        align: 'center',
        formatter: 'codes',
        width: 55
    }, {
        id: 'percent',
        name: 'Percent',
        formatter: 'percent',
        sortable: false,
        align: 'right'
    }, {
        id: 'percent',
        name: '',
        sortable: false,
        formatter: 'percentBar',
        width: 112
    }, {
        id: 'size',
        name: 'Size',
        align: 'right',
        formatter: 'size'
    }, {
        id: 'sizeChanged',
        name: 'Changed',
        align: 'right',
        formatter: 'size',
        width: 100
    }];

    return columns;
};

const renderGrid = () => {

    let grid = state.grid;

    if (!grid) {
        grid = createGrid();
        state.grid = grid;
    }

    const gridData = {
        columns: getGridColumns(),
        rows: getGridRows()
    };

    console.log('gridData', gridData);

    grid.setData(gridData);
    grid.render();

};


const onUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) {
        return;
    }

    const maps = {};

    for (const file of files) {

        let err;
        const str = await file.text().catch((er) => {
            err = er;
        });
        if (err) {
            console.error(err);
            continue;
        }

        maps[file.name] = str;

    }

    state.sourcesAndMaps = maps;

};

const updateGrid = () => {
    const grid = state.grid;
    if (grid) {
        grid.update();
    }
};

const initSourcesAndMaps = async () => {

    const sourcesAndMaps = state.sourcesAndMaps;
    if (!sourcesAndMaps) {
        return;
    }

    const sourceFiles = {};
    const list = [];

    Object.keys(sourcesAndMaps).forEach((filename) => {
        const fileContent = sourcesAndMaps[filename];
        if (filename.slice(-4) === '.map') {
            list.push({
                filename: filename,
                content: fileContent
            });
            return;
        }
        sourceFiles[filename] = fileContent;
    });

    const consumers = [];
    for (const item of list) {
        const consumer = await Consumer(item.content);
        if (!consumer.file) {
            //using map filename to match source filename
            consumer.file = item.filename.slice(0, -4);
        }
        consumers.push(consumer);
        consumer.destroy();
    }

    console.log(consumers);

    state.consumers = consumers;
    state.sourceFiles = sourceFiles;

    renderGrid();
};

const initReportData = () => {
    const reportData = window.reportData;
    if (reportData) {
        const data = JSON.parse(decompress(reportData));
        if (data.name) {
            state.name = data.name;
        }
        state.sourcesAndMaps = data.sourcesAndMaps;
    }
};

watch(() => state.sourcesAndMaps, () => {
    initSourcesAndMaps();
});

watch(() => state.keywords, () => {
    updateGrid();
});


onMounted(() => {
    initReportData();
    initSourcesAndMaps();
});

</script>
<style lang="scss">
html,
body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #333;
}

.vui-app {
    width: 100%;
    height: 100%;
    position: relative;
}

.vui-header {
    padding: 5px 10px;
    background: #f5f5f5;
    border-bottom: 1px solid #ccc;
    box-sizing: border-box;
}

.vui-title {
    height: 30px;
    line-height: 30px;
    font-size: 16px;
    font-weight: bold;
}

.vui-upload {
    padding-left: 20px;
}

.vui-icon {
    display: block;
    width: 20px;
    height: 20px;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 20px 20px;
    opacity: 0.8;
}

.vui-icon:hover {
    opacity: 1;
}

.vui-icon-info {
    background-image: url("./images/info.svg");
}

.vui-icon-passed {
    background-image: url("./images/passed.svg");
}

.vui-icon-failed {
    background-image: url("./images/failed.svg");
}

.vui-icon-github {
    background-image: url("./images/github.svg");
}

.vui-icon-close {
    background-image: url("./images/chrome-close.svg");
}

.vui-icon-arrow-right {
    background-image: url("./images/arrow-right.svg");
}

.vui-body {
    position: relative;
    overflow: hidden;
}

.vui-no-report-data {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    span {
        font-size: 16px;
        padding-right: 20px;
    }
}

/*
filter
*/
.vui-filter {
    padding: 5px 10px;
    border-bottom: 1px solid #ddd;
    overflow: hidden;

    .vui-input {
        input {
            padding-right: 25px;
            background-image: url("./images/search.svg");
            background-repeat: no-repeat;
            background-position: right 5px center;
            background-size: 15px 15px;
        }
    }
}

/*
grid
*/

.vui-grid {
    width: 100%;
    height: 100%;
    overflow: hidden;

    .tg-row {
        .tg-cell {
            border-right: none;
        }

        .vui-icon {
            opacity: 1;
            pointer-events: none;
            width: 16px;
            height: 100%;
            background-size: 16px 16px;
            background-color: #fff;
        }

        .tg-align-center .vui-icon {
            margin: 0 auto;
        }

        .color-match {
            color: midnightblue;
        }

        .vui-percent {
            width: 100%;
            height: 15px;
            border: 1px solid #888;
            border-radius: 3px;
            margin-top: 6px;
        }
    }
}

/*
flyover
*/

.tg-flyover-icon {
    position: absolute;
    top: 0;
    right: 0;
    width: 20px;
    height: 100%;
    display: inline-block;
    cursor: pointer;
}

.vui-flyover-main {
    height: 100%;
    overflow: hidden;
}

.vui-flyover-header {
    background-color: #666;
    padding: 0 10px;
}

.vui-flyover-icon {
    cursor: pointer;
    padding: 9px 0;
}

.vui-flyover-title {
    height: 41px;
    line-height: 41px;
    color: #fff;
    font-size: 16px;
    font-weight: bold;
}

.vui-flyover-content {
    padding: 5px;
    overflow: auto;
}

.vui-codes {
    font-family: monospace;
    white-space: pre;
    width: 50%;
    height: 100%;
    overflow: auto;
}

</style>

