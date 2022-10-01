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
      width="80%"
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
              <pre class="language-"><code ref="currentCodes" /></pre>
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
    VuiFlex, VuiInput, VuiSwitch, VuiFlyover
} = VineUI;

const state = shallowReactive({
    name: 'Source Map Report',
    sourcesAndMaps: null,
    consumers: null,
    sourceFiles: null,
    group: false,
    keywords: '',
    flyoverVisible: false,
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

const highlightCodes = (filename, codes) => {

    const lang = getLang(filename);
    const grammar = Prism.languages[lang] || Prism.languages.javascript;

    const $elem = state.$currentCodes;

    $elem.parentNode.className = `language-${lang}`;
    //console.log(lang, grammar);


    const html = Prism.highlight(codes, grammar, lang);

    //new line mark
    let i = 0;
    const NEW_LINE_EXP = /(\r\n|\r|\n)/g;
    const str = html.replace(NEW_LINE_EXP, function() {
        i += 1;
        return `<br line="${i}">`;
    });
    $elem.innerHTML = str;

    //console.log(codes);

    //$elem.innerHTML = html;

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
        state.$currentCodes.textContent = '';
        state.currentIndex = null;
    }
};

const waitFlyoverEnd = () => {
    return new Promise((resolve) => {
        state.flyoverResolve = resolve;
    });
};

const showCodes = async (rowData) => {
    //console.log(rowData);

    if (state.currentIndex === rowData.tg_index) {
        return;
    }
    state.currentIndex = rowData.tg_index;

    if (!state.flyoverVisible) {
        state.flyoverVisible = true;
        await waitFlyoverEnd();
    }

    state.currentType = rowData.type;
    state.currentFile = rowData.name;

    const codes = rowData.codes;
    if (!codes) {
        state.$currentCodes.textContent = 'Not found codes';
        return;
    }

    //https://github.com/mozilla/source-map

    if (rowData.type === 'original') {
        const generatedRow = rowData.tg_parent;
        state.generatedIndex = generatedRow.index;
    } else {
        //generated
    }

    state.$currentCodes.textContent = codes;

    setTimeout(() => {
        highlightCodes(rowData.name, codes);
    }, 100);
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
    state.currentIndex = null;

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

onMounted(() => {
    state.$currentCodes = currentCodes.value;
    initReportData();
    initSourcesAndMaps();
});

</script>
<style lang="scss" src="./app.scss"></style>
