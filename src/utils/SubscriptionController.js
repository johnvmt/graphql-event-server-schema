// Subscription Controller v0.0.2
import { EventEmitter } from "events";
import ExtendedError from "./ExtendedError.js";

class SubscriptionController extends EventEmitter {
    constructor(options = {}) {
        super();

        this._sanitzedOptions = {
            restart: false, // allow restart
        }

        this._canceled = false;
        this._started = false;
        this._callbacks = new Set();
    }

    get canceled() {
        return this._canceled;
    }

    get started() {
        return this._started;
    }

    get options() {
        return Object.freeze(this._sanitzedOptions);
    }

    publish(...args) {
        this.emit("published", ...args);

        if(this.started) {
            for(let callback of this._callbacks) {
                callback(...args);
            }
        }
    }

    subscribe(callback) {
        if(!this.started)
            this.start();

        this._callbacks.add(callback);
        return this;
    }

    start() {
        if(this.started)
            throw new ExtendedError("Subscription is already started", {code: 'subscription_started'});
        else if(this.canceled && !this._sanitzedOptions.restart)
            throw new ExtendedError("Subscription is already canceled", {code: 'subscription_canceled'});
        else {
            this._started = true;
            this.emit("started");
        }

        return this;
    }

    cancel() {
        if(this.canceled)
            throw new ExtendedError("Subscription is already canceled", {code: 'subscription_canceled'});
        else {
            this._canceled = true;
            this.emit("canceled");
        }

        return this;
    }
}

export default SubscriptionController;
