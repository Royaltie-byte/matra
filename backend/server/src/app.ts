// only creates express stack
import express from "express";

const app = express();

// Built-in middleware
app.use(express.json());

export default app;
