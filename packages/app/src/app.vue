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
            accept=".map"
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
        v-if="!state.sourceMaps"
        class="vui-no-report-data"
      >
        <span>Please select *.map file(s)</span>
        <input
          type="file"
          accept=".map"
          multiple
          @change="onUpload"
        >
      </div>
    </div>
    <VuiFlyover
      :visible="state.flyoverVisible"
      width="60%"
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
              Source
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
          <Source :row-data="state.flyoverData" />
        </div>
      </div>
    </VuiFlyover>
  </VuiFlex>
</template>
<script setup>
import VineUI from 'vine-ui';
import { Grid } from 'turbogrid';
import decompress from 'lz-utils/lib/decompress.js';
import { BF } from './util/util.js';
import {
    onMounted, shallowReactive, watch
} from 'vue';

import Consumer from './util/consumer.js';
import Source from './source.vue';

const {
    VuiFlex, VuiInput, VuiSwitch, VuiFlyover
} = VineUI;

const state = shallowReactive({
    name: 'Source Map Report',
    sourceMaps: null,
    grid: null,
    group: false,
    keywords: '',
    flyoverVisible: false,
    flyoverData: null
});

const initReportData = () => {
    const reportData = window.reportData;
    if (reportData) {
        const data = JSON.parse(decompress(reportData));
        if (data.name) {
            state.name = data.name;
        }
        state.sourceMaps = data.sourceMaps;
    }
};

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

    if (!state.flyoverVisible && !force) {
        return;
    }

    state.flyoverVisible = true;

    rowData.sizeH = BF(rowData.size);
    state.flyoverData = rowData;

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

    grid.bind('onUpdated', () => {
        //updateFilterInfo(gridName);
    });

    grid.setOption({
        //textSelectable: true,
        //frozenRow: 0,
        rowHeight: 27,
        sortField: 'size',
        sortAsc: false,
        sortOnInit: true,
        selectMultiple: false,
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

            if (rd.type === 'source') {
                v += `
                <div class="tg-cell-hover-icon tg-flyover-icon" title="Click to show module detail">
                    <div class="tg-info-icon" />
                </div>
            `;
            }
            return df(v, rd, cd, node);
        },

        size: function(v, rd, cd) {
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
            return `
            <div class="vui-percent" style="background:linear-gradient(to right, #999 ${v}%, #fff ${v}%);"></div>
            `;
        }
    });

    return grid;

};

const getGridRows = (consumers) => {
    const rows = [];

    let mapSize = 0;
    consumers.forEach((consumer) => {

        let totalSize = 0;
        const contents = consumer.sourcesContent || [];

        const subs = consumer.sources.map((it, i) => {
            const content = contents[i];
            const size = content ? content.length : 0;
            totalSize += size;
            return {
                name: it,
                size,
                percent: 0,
                type: 'source',
                content
            };
        });

        mapSize += totalSize;
        if (totalSize && subs.length > 1) {
            subs.forEach((row) => {
                row.percent = (row.size / totalSize * 100).toFixed(2);
            });
        }

        const row = {
            name: consumer.file,
            size: totalSize,
            subs
        };

        rows.push(row);

    });

    if (mapSize && rows.length > 1) {
        rows.forEach((row) => {
            row.percent = (row.size / mapSize * 100).toFixed(2);
        });
    }

    return rows;

};

const getGridColumns = () => {
    const columns = [{
        id: 'name',
        name: 'Name',
        width: 600,
        maxWidth: 2048
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
        formatter: 'size',
        width: 80
    }];

    return columns;
};

const renderGrid = async () => {

    const sourceMaps = state.sourceMaps;
    if (!Array.isArray(sourceMaps)) {
        return;
    }

    const consumers = [];
    for (const item of sourceMaps) {
        const consumer = await Consumer(item);
        consumers.push(consumer);
        consumer.destroy();
    }

    console.log(consumers);

    let grid = state.grid;

    if (!grid) {
        grid = createGrid();
        state.grid = grid;
    }

    const gridData = {
        columns: getGridColumns(),
        rows: getGridRows(consumers)
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

    const list = [];

    for (const file of files) {
        let err;
        const str = await file.text().catch((er) => {
            err = er;
        });
        if (err) {
            console.error(err);
            continue;
        }
        list.push(str);
    }

    if (!list.length) {
        return;
    }

    state.sourceMaps = list;

};

const updateGrid = () => {
    const grid = state.grid;
    if (grid) {
        grid.update();
    }
};

watch(() => state.sourceMaps, () => {
    renderGrid();
});

watch(() => state.keywords, () => {
    updateGrid();
});


onMounted(() => {
    initReportData();
    renderGrid();
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

.tg-info-icon {
    width: 100%;
    height: 100%;
    background-color: #fff;
    pointer-events: none;
    background-repeat: no-repeat;
    background-position: center center;
    background-image: url("./images/info-circle-outlined.svg");
}

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
    padding: 10px;
    overflow: auto;
}

</style>

