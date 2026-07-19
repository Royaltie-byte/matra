// only creates express application stack
import express from "express";
// add routing capability for the different routes ( imports )
import homeRouter from "./routes/home.routes.js";
import healthRouter from "./routes/health.routes.js";
import authRouter from "./routes/auth.routes.js";
import mothersRoutes from "./routes/mothers.routes.js";
import enrollmentRouter from './routes/enrollment.routes.js';

//add a global middleware that logs the method, ip and original url for all routes
import { logger } from "./middleware/log.middleware.js";


const app = express();


// built-in middleware
app.use(express.json());
app.use(logger);

// register application routes

app.use('/',homeRouter);
app.use('/health',healthRouter)
app.use('/auth', authRouter);
app.use("/mothers", mothersRoutes);
app.use('/enrollment',enrollmentRouter)


export default app;
