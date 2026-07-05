import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = Router();

router.get('/',getHealth);

//exporting the health router to make it accessible by the app

export default router;