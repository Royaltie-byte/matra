//this file adds the property user to  the Request type which it 
//currently doesn't have , so that we can do actions like 
//console.log(req.user); after authentication to print user details

import { JwtPayload } from 'jsonwebtoken';

declare global{
    namespace Express{
        interface Request{
            user?: JwtPayload & {
                user_id: string;
                organization_id: string;
                role: string;
            };
        }
    }
}

