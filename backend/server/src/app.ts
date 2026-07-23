// only creates express application stack
import express from "express";
// add routing capability for the different routes ( imports )
import homeRouter from "./routes/home.routes.js";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";
import mothersRouter from "./routes/mothers.routes.js";
import enrollmentRouter from './routes/enrollment.routes.js';
import deliveryRouter from "./routes/delivery.routes.js";
import webhookRouter from './routes/webhooks.routes.js';
import messageRouter from './routes/messages.routes.js';

//add a global middleware that logs the method, ip and original url for all routes
import { logger } from "./middleware/log.middleware.js";


const app = express();



app.use(express.json()); //json body parser for holding json requests from the body,
app.use(express.urlencoded({ extended: true })); //parsing form-encoded data to our server from africastalking server
app.use(logger);

// register application routes

app.use('/',homeRouter);
app.use('/health',healthRouter)
app.use('/auth', authRouter);
app.use("/mothers", mothersRouter);
app.use('/enrollments',enrollmentRouter); //change to match the one on delivery { nested routes }
app.use("/enrollments", deliveryRouter);
app.use('/mothers',messageRouter);
app.use('/webhooks',webhookRouter);



export default app;
