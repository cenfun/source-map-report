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
          Source Map Report
        </div>
        <div class="vui-upload">
          <input
            type="file"
            accept=".map"
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
        v-if="!state.reportData"
        class="vui-no-report-data"
      >
        <span>Please select a *.map file</span>
        <input
          type="file"
          accept=".map"
          @change="onUpload"
        >
      </div>
    </div>
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

const {
    VuiFlex, VuiInput, VuiSwitch
} = VineUI;

const state = shallowReactive({
    reportData: decompress(window.reportData),
    grid: null,
    group: false,
    keywords: ''
});

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

const createGrid = () => {

    const grid = new Grid('.vui-grid');

    grid.bind('onClick', (e, d) => {
        if (!d.rowNode) {
            return;
        }
        const rowItem = d.rowItem;

        // let openFlyover = false;
        // const icon = d.e.target;
        // if (icon.classList.contains('tg-flyover-icon')) {
        //     openFlyover = true;
        // }
        //showFlyover(rowItem, openFlyover);

        grid.setRowSelected(rowItem, d.e);

    });

    // grid.bind('onDblClick', (e, d) => {
    //     if (!d.rowNode) {
    //         return;
    //     }
    //     const rowItem = d.rowItem;
    //     //showFlyover(rowItem, true);
    // });

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

            if (rd.loaders) {
                v = `❁${v}`;
            }

            if (rd.name_color) {
                v = `<span style="color:${rd.name_color};">${v}</span>`;
            }

            if (rd.paths || rd.bailout) {
                v += `
                <div class="tg-cell-hover-icon tg-flyover-icon" title="Click to show module detail">
                    <div class="tg-issuer-icon" />
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

const getGridRows = (consumer) => {

    let totalSize = 0;

    const contents = consumer.sourcesContent || [];

    const rows = consumer.sources.map((it, i) => {
        const content = contents[i];
        const size = content ? content.length : 0;
        totalSize += size;
        return {
            name: it,
            size,
            percent: 0
        };
    });

    if (totalSize) {
        rows.forEach((row) => {
            row.percent = (row.size / totalSize * 100).toFixed(2);
        });
    }

    return rows;

};

const getGridColumns = (consumer) => {
//update every time for invisible
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

    const reportData = state.reportData;
    if (!reportData) {
        return;
    }

    let grid = state.grid;

    if (!grid) {
        grid = createGrid();
        state.grid = grid;
    }

    const consumer = await Consumer(reportData);
    console.log(consumer);

    const gridData = {
        columns: getGridColumns(consumer),
        rows: getGridRows(consumer)
    };

    consumer.destroy();

    console.log('gridData', gridData);

    grid.setData(gridData);
    grid.render();

};


const onUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    //console.log(file);

    let err;
    const str = await file.text().catch((er) => {
        err = er;
    });

    if (err) {
        console.error(err);
        return;
    }

    state.reportData = str;

};

const updateGrid = () => {
    const grid = state.grid;
    if (grid) {
        grid.update();
    }
};

watch(() => state.reportData, () => {
    renderGrid();
});

watch(() => state.keywords, () => {
    updateGrid();
});


onMounted(() => {
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
    background-image: url("images/github.svg");
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

</style>

