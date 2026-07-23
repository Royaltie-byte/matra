import { Router } from 'express';
import { receiveInboundSms } from '../controllers/webhooks.controller.js';

const router = Router();

//webhooks sms handler  /webhooks/sms/inbound.


router.post('/sms/inbound',receiveInboundSms);



export default router;