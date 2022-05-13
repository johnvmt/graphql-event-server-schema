import eventExecutableSchema from "../dist/exports.js";
import GraphQLHTTPWSServer from "graphql-http-ws-server";

const schema = eventExecutableSchema();

new GraphQLHTTPWSServer(schema, {
    port: 80,
    graphqlPath: '/graphql',
    subscriptionsPath: '/graphql',
    debug: true
});
