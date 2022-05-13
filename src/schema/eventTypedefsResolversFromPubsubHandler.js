import fs from "fs";
import path, {dirname} from "path";
import {fileURLToPath} from "url";
import gql from "graphql-tag";
import { EventEmitterAsyncIterator } from "event-emitter-async-iterator";
import GraphQLObjectOrPrimitiveType from "./types/GraphQLObjectOrPrimitiveType.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typeDefs = gql(fs.readFileSync(path.join(__dirname, "eventSchema.schema")).toString());

/**
 * Return resolvers and typedefs from pub/sub handler
 * @param pubsubHandler
 * @returns {{typeDefs, resolvers}}
 */
const eventTypedefsResolversFromPubsubHandler = (pubsubHandler) => {
    const resolvers = {
        ObjectOrPrimitive: GraphQLObjectOrPrimitiveType,

        Mutation: {
            event: (obj, args, context, info) => {
                const { channel, payload } = args;
                pubsubHandler.publish(channel, payload);
                return true;
            }
        },
        Subscription: {
            event: {
                subscribe: (obj, args, context, info) => {
                    const { channel } = args;

                    const asyncIterator = new EventEmitterAsyncIterator();
                    const subscriptionController = pubsubHandler.subscribe(channel);

                    subscriptionController.subscribe(payload => {
                        asyncIterator.pushValue({
                            event: {
                                channel: channel,
                                payload: payload
                            }
                        });
                    })

                    asyncIterator.once('return', () => {
                        subscriptionController.cancel();
                    });

                    return asyncIterator;
                }
            }
        }
    };

    return {
        resolvers: resolvers,
        typeDefs: typeDefs
    }
}

export default eventTypedefsResolversFromPubsubHandler;
