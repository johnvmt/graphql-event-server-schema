import ExtendedError from "../utils/ExtendedError.js";

class PubSub {
    subscribe(channel) {
        throw new ExtendedError("Not implemented", {code: "not_implemented"});
    }

    publish(channel, payload) {
        throw new ExtendedError("Not implemented", {code: "not_implemented"});
    }
}

export default PubSub;
