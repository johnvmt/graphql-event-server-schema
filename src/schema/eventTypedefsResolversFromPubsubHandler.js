import gql from "graphql-tag";
import { EventEmitterAsyncIterator } from "event-emitter-async-iterator";
import GraphQLObjectOrPrimitiveType from "./types/GraphQLObjectOrPrimitiveType.js";

const typeDefs = gql(`scalar ObjectOrPrimitive
    type Event {
        channel: ID!
        payload: ObjectOrPrimitive!
    }
    
    extend type Query {
        _placeholder: String
    }
    
    extend type Mutation {
        event(channel: ID!, payload: ObjectOrPrimitive!): Boolean!
    }
    
    extend type Subscription {
        event(channel: ID!): Event!
    }`);

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
