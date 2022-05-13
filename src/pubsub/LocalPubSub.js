import PubSub from "./PubSub.js";
import SubscriptionController from "../utils/SubscriptionController.js";

class LocalPubSub extends PubSub {
    constructor() {
        super();

        this._subscriptionControllersByChannel = new Map();
    }

    publish(channel, payload) {
        if(this._subscriptionControllersByChannel.has(channel)) { // only publish if this channel has subscribers
            for(let subscriptionController of this._subscriptionControllersByChannel.get(channel)) {
                subscriptionController.publish(payload);
            }
        }
    }

    subscribe(channel) {
        const subscriptionController = new SubscriptionController();

        if(!this._subscriptionControllersByChannel.has(channel)) // create set for this channel, if it doesn't exist
            this._subscriptionControllersByChannel.set(channel, new Set());

        const channelSubscriptionControllers = this._subscriptionControllersByChannel.get(channel);

        subscriptionController.once("canceled", () => {
            channelSubscriptionControllers.delete(subscriptionController);

            if(channelSubscriptionControllers.size === 0)
                this._subscriptionControllersByChannel.delete(channel);
        });

        channelSubscriptionControllers.add(subscriptionController);

        return subscriptionController;
    }
}

export default LocalPubSub;
