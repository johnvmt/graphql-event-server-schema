// src/schema/eventExecutableSchema.js
import { makeExecutableSchema } from "@graphql-tools/schema";

// src/utils/ExtendedError.js
var ExtendedError = class extends Error {
  constructor(message, attach = {}) {
    super(message);
    Object.assign(this, attach);
  }
};
var ExtendedError_default = ExtendedError;

// src/pubsub/PubSub.js
var PubSub = class {
  subscribe(channel) {
    throw new ExtendedError_default("Not implemented", { code: "not_implemented" });
  }
  publish(channel, payload) {
    throw new ExtendedError_default("Not implemented", { code: "not_implemented" });
  }
};
var PubSub_default = PubSub;

// src/utils/SubscriptionController.js
import { EventEmitter } from "events";
var SubscriptionController = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this._sanitzedOptions = {
      restart: false
    };
    this._canceled = false;
    this._started = false;
    this._callbacks = /* @__PURE__ */ new Set();
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
    if (this.started) {
      for (let callback of this._callbacks) {
        callback(...args);
      }
    }
  }
  subscribe(callback) {
    if (!this.started)
      this.start();
    this._callbacks.add(callback);
    return this;
  }
  start() {
    if (this.started)
      throw new ExtendedError_default("Subscription is already started", { code: "subscription_started" });
    else if (this.canceled && !this._sanitzedOptions.restart)
      throw new ExtendedError_default("Subscription is already canceled", { code: "subscription_canceled" });
    else {
      this._started = true;
      this.emit("started");
    }
    return this;
  }
  cancel() {
    if (this.canceled)
      throw new ExtendedError_default("Subscription is already canceled", { code: "subscription_canceled" });
    else {
      this._canceled = true;
      this.emit("canceled");
    }
    return this;
  }
};
var SubscriptionController_default = SubscriptionController;

// src/pubsub/LocalPubSub.js
var LocalPubSub = class extends PubSub_default {
  constructor() {
    super();
    this._subscriptionControllersByChannel = /* @__PURE__ */ new Map();
  }
  publish(channel, payload) {
    if (this._subscriptionControllersByChannel.has(channel)) {
      for (let subscriptionController of this._subscriptionControllersByChannel.get(channel)) {
        subscriptionController.publish(payload);
      }
    }
  }
  subscribe(channel) {
    const subscriptionController = new SubscriptionController_default();
    if (!this._subscriptionControllersByChannel.has(channel))
      this._subscriptionControllersByChannel.set(channel, /* @__PURE__ */ new Set());
    const channelSubscriptionControllers = this._subscriptionControllersByChannel.get(channel);
    subscriptionController.once("canceled", () => {
      channelSubscriptionControllers.delete(subscriptionController);
      if (channelSubscriptionControllers.size === 0)
        this._subscriptionControllersByChannel.delete(channel);
    });
    channelSubscriptionControllers.add(subscriptionController);
    return subscriptionController;
  }
};
var LocalPubSub_default = LocalPubSub;

// src/schema/eventTypedefsResolversFromPubsubHandler.js
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import gql from "graphql-tag";
import EventEmitterAsyncIterator from "event-emitter-async-iterator";

// src/schema/types/GraphQLObjectOrPrimitiveType.js
import { GraphQLScalarType, Kind } from "graphql";
var GraphQLObjectOrPrimitiveType_default = new GraphQLScalarType({
  name: "ObjectOrPrimitive",
  description: "Object or Primitive (boolean, number, string)",
  parseValue: (value) => {
    if (typeof value === "object")
      return value;
    else if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    } else
      return value;
  },
  serialize: (value) => {
    if (typeof value === "object")
      return value;
    else if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    } else
      return value;
  },
  parseLiteral: (ast) => {
    switch (ast.kind) {
      case Kind.OBJECT:
        throw new Error(`Not sure what to do with OBJECT for ObjectScalarType`);
      case Kind.STRING:
        try {
          return JSON.parse(ast.value);
        } catch (error) {
          return ast.value;
        }
      default:
        return ast.value;
    }
  }
});

// src/schema/eventTypedefsResolversFromPubsubHandler.js
var __dirname2 = dirname(fileURLToPath(import.meta.url));
var typeDefs = gql(fs.readFileSync(path.join(__dirname2, "eventSchema.schema")).toString());
var eventTypedefsResolversFromPubsubHandler = (pubsubHandler) => {
  const resolvers = {
    ObjectOrPrimitive: GraphQLObjectOrPrimitiveType_default,
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
          subscriptionController.subscribe((payload) => {
            asyncIterator.pushValue({
              event: {
                channel,
                payload
              }
            });
          });
          asyncIterator.once("return", () => {
            subscriptionController.cancel();
          });
          return asyncIterator;
        }
      }
    }
  };
  return {
    resolvers,
    typeDefs
  };
};
var eventTypedefsResolversFromPubsubHandler_default = eventTypedefsResolversFromPubsubHandler;

// src/schema/eventTypedefsResolvers.js
var eventTypedefsResolvers = (pubsubHandler = void 0, logger = void 0) => {
  if (!pubsubHandler)
    pubsubHandler = new LocalPubSub_default(logger);
  return eventTypedefsResolversFromPubsubHandler_default(pubsubHandler);
};
var eventTypedefsResolvers_default = eventTypedefsResolvers;

// src/schema/eventExecutableSchema.js
var eventExecutableSchema = (pubsubHandler, logger) => {
  return makeExecutableSchema(eventTypedefsResolvers_default(pubsubHandler, logger));
};
var eventExecutableSchema_default = eventExecutableSchema;

// src/exports.js
var exports_default = eventExecutableSchema_default;
export {
  LocalPubSub_default as LocalPubSub,
  PubSub_default as PubSub,
  exports_default as default,
  eventExecutableSchema_default as eventExecutableSchema,
  eventTypedefsResolvers_default as eventTypedefsResolvers
};
