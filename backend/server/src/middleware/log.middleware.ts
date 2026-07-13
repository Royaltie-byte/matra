//middlware is code that runs between request and response 
//it runs before the request reaches the controller in the server
//it can modify the request body , or even catch errors early, or 
//used to tighten security.

import type { Request , Response , NextFunction } from 'express';

//middleware that logs the ip and original url of the request

export const  logger = (req: Request , res: Response , next: NextFunction) => {
    console.log(`${req.method} ${req.ip} ${req.originalUrl}`);
    next(); //very important, allows the middleware to pass to the controller.
}

//middleware can also be used in a single router alone i.e ( router.use(logger);)
//useful for features such as authenticateToken.