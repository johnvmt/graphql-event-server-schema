import LocalPubSub from "../pubsub/LocalPubSub.js";
import eventTypedefsResolversFromPubsubHandler from "./eventTypedefsResolversFromPubsubHandler.js";

const eventTypedefsResolvers = (pubsubHandler = undefined, logger = undefined) => {
    if(!pubsubHandler)
        pubsubHandler = new LocalPubSub(logger);

    return eventTypedefsResolversFromPubsubHandler(pubsubHandler);
}

export default eventTypedefsResolvers;
