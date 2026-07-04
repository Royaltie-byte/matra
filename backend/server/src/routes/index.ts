// routing layer, with only request logic
import { Router } from "express";
import { getHome } from "../controllers/indexController.js";

const router = Router();

router.get("/", getHome);


export default router;