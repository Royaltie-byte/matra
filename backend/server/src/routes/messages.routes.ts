import { Router } from 'express';
import { authenticateToken  } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/requireRole.middleware.js';
import { getMessages , sendOutboundManualMessage } from '../controllers/messages.controller.js';

const router = Router();

//getting conversation history route
router.get(
    '/:id/messages',
    authenticateToken,
    requireRole(['NURSE','DOCTOR']),
    getMessages
);


//manual outreach by health practicioner from the dashboard.
router.post(
    '/:id/messages/send',
    authenticateToken,
    requireRole(['NURSE','DOCTOR']),
    sendOutboundManualMessage
);


export default router;