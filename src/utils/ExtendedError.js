// ExtendedError v0.0.1
class ExtendedError extends Error {
    constructor(message, attach = {}) {
        super(message);
        Object.assign(this, attach);
    }
}

export default ExtendedError;
