import { makeExecutableSchema } from "@graphql-tools/schema";
import eventTypedefsResolvers from "./eventTypedefsResolvers.js";

const eventExecutableSchema = (pubsubHandler, logger) => {
    return makeExecutableSchema(eventTypedefsResolvers(pubsubHandler, logger));
};

export default eventExecutableSchema;
