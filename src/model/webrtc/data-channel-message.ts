import { computed, observable } from 'mobx';

import { InputRTCMessage } from '../../types';
import { asBuffer } from '../../util';

// All of this is technically independent of WebSocketMessage, but *extremely* similar, since
// they're fundamentally used in very similar ways. Not directly shared as it's quite possible
// they'll diverge in future.
export class DataChannelMessage {

    @observable
    private inputMessage: InputRTCMessage;

    public readonly cache = observable.map(new Map<symbol, unknown>(), { deep: false });

    constructor(
        inputMessage: InputRTCMessage,
        public readonly messageIndex: number
    ) {
        this.inputMessage = inputMessage;
    }

    get direction() {
        return this.inputMessage.direction;
    }

    @computed
    get content() {
        return asBuffer(this.inputMessage.content);
    }

    get isBinary() {
        return this.inputMessage.isBinary;
    }

    get contentType() {
        if (this.inputMessage.isBinary) return 'raw';

        // prefix+JSON is very common, so we try to parse anything JSON-ish optimistically:
        const startOfMessage = this.content.slice(0, 10).toString('utf-8');
        if (startOfMessage.includes('{') || startOfMessage.includes('[')) return 'json';
        else return 'text';
    }

    cleanup() {
        // As with Exchange & WebSocketStream - in some cases, browsers can keep references to
        // these messages, which causes issues with releasing memory, so we aggressively drop
        // internal references to potentially large data to compensate.
        this.inputMessage.content = Buffer.from([]);
        this.cache.clear();
    }

}