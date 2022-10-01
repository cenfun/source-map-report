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
        <!-- <VuiSwitch
          v-model="state.group"
          label="Group by Path"
        /> -->
      </VuiFlex>
    </div>
    <div class="vui-body vui-flex-auto">
      <Grid @show-codes="showCodes" />
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
      width="50%"
      position="right"
      @end="onFlyoverEnd"
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
          <div class="vui-codes">
            <div class="vui-current-codes line-numbers">
              <pre class="language-"><code
                  ref="currentCodes"
                  @click="clickCodesHandler"
              /></pre>
            </div>
          </div>
        </div>
      </div>
    </VuiFlyover>
  </VuiFlex>
</template>
<script setup>
import VineUI from 'vine-ui';
import {
    onMounted, shallowReactive, watch, ref, provide
} from 'vue';

import decompress from 'lz-utils/lib/decompress.js';
import Consumer from './util/consumer.js';
import Grid from './grid.vue';

import Prism from 'prismjs';

import 'prismjs/themes/prism-coy.css';

import 'prismjs/components/prism-scss.js';
//import 'prismjs/components/prism-css-extras.js';

import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

//import 'prismjs/plugins/inline-color/prism-inline-color.js';
//import 'prismjs/plugins/inline-color/prism-inline-color.css';

const langMap = {
    'vue': 'html',
    'sass': 'css',
    'less': 'css',
    'mjs': 'js',
    'ts': 'js'
};


const {
    //VuiSwitch,
    VuiFlex, VuiInput, VuiFlyover, VuiPopover
} = VineUI;

const state = shallowReactive({
    name: 'Source Map Report',
    sourcesAndMaps: null,
    consumers: null,
    sourceFiles: null,
    group: false,
    keywords: '',
    flyoverVisible: false,
    currentRow: null,
    currentFile: ''
});

provide('state', state);

const currentCodes = ref(null);

// const htmlEscape = (str = '') => {
//     return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;');
// };

const getLang = (name = '') => {
    let lang = '';
    const di = name.lastIndexOf('.');
    if (di !== -1) {
        const extname = name.slice(di + 1);
        lang = langMap[extname] || extname;
    }
    return lang || 'js';
};

let highlightCache = {};
let highlightIndex = null;

const highlightCodes = (codes, large) => {
    const lang = getLang(state.currentFile);
    const grammar = Prism.languages[lang] || Prism.languages.javascript;
    //console.log(lang, grammar);

    const $elem = state.$code;

    //large codes no need highlight
    if (!large) {
        let html = highlightCache[highlightIndex];
        if (!html) {
            html = Prism.highlight(codes, grammar, lang);
            highlightCache[highlightIndex] = html;
        }

        $elem.innerHTML = html;
    }

    $elem.parentNode.className = `language-${lang}`;

    //update line numbers
    Prism.hooks.run('complete', {
        code: codes,
        grammar: grammar,
        language: lang,
        element: $elem
    });

};

const onFlyoverEnd = (v) => {
    if (state.flyoverResolve) {
        state.flyoverResolve(v);
        state.flyoverResolve = null;
    }
    if (!v) {
        state.$code.textContent = '';
        highlightIndex = null;
    }
};

const waitFlyoverEnd = () => {
    return new Promise((resolve) => {
        state.flyoverResolve = resolve;
    });
};

const showCodes = async (currentRow) => {
    //console.log(currentRow);

    if (highlightIndex === currentRow.tg_index) {
        return;
    }
    highlightIndex = currentRow.tg_index;

    if (!state.flyoverVisible) {
        state.flyoverVisible = true;
        await waitFlyoverEnd();
    }

    state.currentRow = currentRow;
    state.currentFile = currentRow.name;

    const codes = currentRow.codes;
    if (!codes) {
        state.$code.textContent = 'Not found codes';
        return;
    }

    state.$code.textContent = codes;

    clearTimeout(state.timeoutId);
    state.timeoutId = setTimeout(() => {
        highlightCodes(codes, currentRow.large);
    }, 100);
};

const openPopover = function(target, line, content) {
    VuiPopover.createComponent({
        target: target,
        positions: ['left'],
        width: 350,
        title: `Generated codes for line: ${line}`,
        content: content
    });
};

//https://github.com/mozilla/source-map
const clickCodesHandler = (e) => {

    const currentRow = state.currentRow;
    //not for generated
    if (currentRow.type !== 'original') {
        return;
    }
    //not for large
    if (currentRow.large) {
        return;
    }

    //const originalIndex = currentRow.tg_index;
    //const originalCodes = currentRow.codes;
    const originalCodeLines = currentRow.codeLines;

    const generatedRow = currentRow.tg_parent;
    const consumerIndex = generatedRow.index;
    //const generatedIndex = generatedRow.tg_index;
    const generatedCodes = generatedRow.codes;
    const generatedCodeLines = generatedRow.codeLines;

    if (!generatedCodes) {
        return;
    }

    //current consumer
    const consumer = state.consumers[consumerIndex];
    if (!consumer) {
        return;
    }

    const lineCount = originalCodeLines.length;
    const { offsetY } = e;
    const currentLine = Math.ceil(offsetY / state.$code.clientHeight * lineCount);
    //console.log(currentLine);

    const $rows = state.$code.querySelector('.line-numbers-rows');
    Array.from($rows.querySelectorAll('.line-focus')).forEach(($row) => $row.classList.remove('line-focus'));

    const $row = $rows.children[currentLine - 1];
    $row.classList.add('line-focus');


    //The line number is 1-based.
    //The column number is 0-based.
    const originalLineCodes = originalCodeLines[currentLine - 1];
    // console.log(originalLineCodes);
    if (originalLineCodes.length > 1000) {
        return;
    }

    const list = consumer.allGeneratedPositionsFor({
        source: state.currentFile,
        line: currentLine
    });

    list.sort((a, b) => {
        if (a.line === b.line) {
            if (a.column === b.column) {
                return 0;
            }
            return a.column > b.column ? 1 : -1;
        }
        return a.line > b.line ? 1 : -1;
    });

    // const pos = list.map((item) => {
    //     return `${item.line}:${item.column}-${item.lastColumn}`;
    // });
    // console.log(pos);

    //The line number is 1-based.
    //The column number is 0-based.
    const lineCodes = list.map((item) => {
        if (typeof item.lastColumn === 'number') {
            const line = generatedCodeLines[item.line - 1];
            if (line) {
                return line.slice(item.column, item.lastColumn + 1);
            }
        }
    });
    //console.log(lineCodes);

    const codes = lineCodes.filter((it) => it).join('');

    //console.log(codes);

    if (!codes) {
        return;
    }

    openPopover($row, currentLine, codes);

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
    state.currentRow = null;

    highlightCache = {};
    highlightIndex = null;

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

const onUpload = async (e) => {

    state.flyoverVisible = false;

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

watch(() => state.sourcesAndMaps, () => {
    initSourcesAndMaps();
});

onMounted(() => {
    state.$code = currentCodes.value;
    initReportData();
    initSourcesAndMaps();
});

</script>
<style lang="scss" src="./app.scss"></style>
