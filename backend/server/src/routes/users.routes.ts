//this route will GET a list of all staff in the organization , but it is role 
//restricted so this is where we will test the authorisation middleware.

import  { Router } from 'express';
import { getUsers  } from '../controllers/users.controller.js';

const router = Router();

router.get('/',getUsers);

