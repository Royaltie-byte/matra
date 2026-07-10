// only creates express application stack
import express from "express";
// add routing capability for the different routes ( imports )
import homeRouter from "./routes/home.routes.js";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";

const app = express();

// built-in middleware
app.use(express.json());

// register application routes

app.use('/',homeRouter);
app.use('/health',healthRouter)
app.use('/auth', authRouter);


export default app;
