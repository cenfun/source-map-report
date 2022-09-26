import { SourceMapConsumer } from 'source-map';

import wasm from 'source-map/lib/mappings.wasm';

let initialized = false;
const initialize = async () => {
    const res = await fetch(wasm);
    //console.log(res);

    const ab = await res.arrayBuffer();

    SourceMapConsumer.initialize({
        'lib/mappings.wasm': ab
    });

    initialized = true;
};

export default async (sourceMap) => {
    if (!initialized) {
        await initialize();
    }
    return new SourceMapConsumer(sourceMap);
};
