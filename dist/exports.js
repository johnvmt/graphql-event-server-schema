var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/exports.js
var exports_exports = {};
__export(exports_exports, {
  LocalPubSub: () => LocalPubSub_default,
  PubSub: () => PubSub_default,
  default: () => exports_default,
  eventExecutableSchema: () => eventExecutableSchema_default,
  eventTypedefsResolvers: () => eventTypedefsResolvers_default
});
module.exports = __toCommonJS(exports_exports);

// node_modules/tsup/assets/cjs_shims.js
var getImportMetaUrl = () => typeof document === "undefined" ? new URL("file:" + __filename).href : document.currentScript && document.currentScript.src || new URL("main.js", document.baseURI).href;
var importMetaUrl = /* @__PURE__ */ getImportMetaUrl();

// src/schema/eventExecutableSchema.js
var import_schema = require("@graphql-tools/schema");

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
var import_events = require("events");
var SubscriptionController = class extends import_events.EventEmitter {
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
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_url = require("url");
var import_graphql_tag = __toESM(require("graphql-tag"));
var import_event_emitter_async_iterator = __toESM(require("event-emitter-async-iterator"));

// src/schema/types/GraphQLObjectOrPrimitiveType.js
var import_graphql = require("graphql");
var GraphQLObjectOrPrimitiveType_default = new import_graphql.GraphQLScalarType({
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
      case import_graphql.Kind.OBJECT:
        throw new Error(`Not sure what to do with OBJECT for ObjectScalarType`);
      case import_graphql.Kind.STRING:
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
var __dirname = (0, import_path.dirname)((0, import_url.fileURLToPath)(importMetaUrl));
var typeDefs = (0, import_graphql_tag.default)(import_fs.default.readFileSync(import_path.default.join(__dirname, "eventSchema.schema")).toString());
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
          const asyncIterator = new import_event_emitter_async_iterator.default();
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
  return (0, import_schema.makeExecutableSchema)(eventTypedefsResolvers_default(pubsubHandler, logger));
};
var eventExecutableSchema_default = eventExecutableSchema;

// src/exports.js
var exports_default = eventExecutableSchema_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LocalPubSub,
  PubSub,
  eventExecutableSchema,
  eventTypedefsResolvers
});
