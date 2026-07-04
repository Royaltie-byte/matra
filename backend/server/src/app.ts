// only creates express application stack
import express from "express";
// add routing capabilities
import routes from "./routes/index.js";

const app = express();

// built-in middleware
app.use(express.json());
// register application routes
app.use(routes);


export default app;
