import { makeExecutableSchema } from '@graphql-tools/schema';
import { EventEmitter } from 'events';
import gql from 'graphql-tag';
import { EventEmitterAsyncIterator } from 'event-emitter-async-iterator';
import { GraphQLScalarType, Kind } from 'graphql';

// ExtendedError v0.0.1
class ExtendedError extends Error {
    constructor(message, attach = {}) {
        super(message);
        Object.assign(this, attach);
    }
}

class PubSub {
    subscribe(channel) {
        throw new ExtendedError("Not implemented", {code: "not_implemented"});
    }

    publish(channel, payload) {
        throw new ExtendedError("Not implemented", {code: "not_implemented"});
    }
}

// Subscription Controller v0.0.2

class SubscriptionController extends EventEmitter {
    constructor(options = {}) {
        super();

        this._sanitzedOptions = {
            restart: false, // allow restart
        };

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

// ObjectOrPrimitive v0.0.1

var GraphQLObjectOrPrimitiveType = new GraphQLScalarType({
    name: 'ObjectOrPrimitive',
    description: 'Object or Primitive (boolean, number, string)',
    parseValue: (value) => {
        if(typeof value === 'object')
            return value;
        else if(typeof value === 'string') {
            try {
                return JSON.parse(value)
            } catch (error) {
                return value;
            }
        }
        else
            return value;

    },
    serialize: (value) => {
        if(typeof value === 'object')
            return value;
        else if(typeof value === 'string') {
            try {
                return JSON.parse(value)
            } catch (error) {
                return value;
            }
        }
        else
            return value;
    },
    parseLiteral: (ast) => {
        switch (ast.kind) {
            case Kind.OBJECT:
                throw new Error(`Not sure what to do with OBJECT for ObjectScalarType`);
            case Kind.STRING:
                try {
                    return JSON.parse(ast.value);
                }
                catch(error) {
                    return ast.value;
                }
            default:
                return ast.value;
        }
    }
});

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
                    });

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
};

const eventTypedefsResolvers = (pubsubHandler = undefined, logger = undefined) => {
    if(!pubsubHandler)
        pubsubHandler = new LocalPubSub(logger);

    return eventTypedefsResolversFromPubsubHandler(pubsubHandler);
};

const eventExecutableSchema = (pubsubHandler, logger) => {
    return makeExecutableSchema(eventTypedefsResolvers(pubsubHandler, logger));
};

export { LocalPubSub, PubSub, eventExecutableSchema as default, eventExecutableSchema, eventTypedefsResolvers };
