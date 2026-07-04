// routing layer, with only the request logic

import { Router } from "express";
import { getHome } from "../controllers/indexController.js";

const router = Router();

router.get("/", getHome);


export default router;