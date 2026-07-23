import type { Request , Response } from 'express';
import { findMotherByPhoneOnly , insertMessage } from '../services/messages.service.js';
import { findActiveEnrollmentByMother } from '../services/enrollment.service.js';

//==========webhooks/sms/inbound controller =============//

export const receiveInboundSms = async ( req: Request , res: Response ) => {
    try{
        //doesn't use jwt authentication and thus we don't have req.user.
        //we only have phone number from the mother.

        console.log('WEBHOOK PAYLOAD STRUCTURE:',req.body);

        const { from , text , id, linkId } = req.body;

        if( !from || !text ){
            console.warn("received malformed payload from the inbound sms:",req.body);
            return res.status(200).send("OK")
        }

        const candidateMothers = await findMotherByPhoneOnly(from);

        //since a mother can be in two different organizations , we find the 
        //active enrollment , since only one enrollment can be active.

        let matchedEnrollment = null;
        let matchedMother = null;

        for(const mother of candidateMothers ){
            const enrollment = await findActiveEnrollmentByMother(mother.mother_id, mother.organization_id);
            if(enrollment){
                matchedEnrollment = enrollment;
                matchedMother = mother;
                break;
            }
        }

        //if no active enrollment is found for this number in all organizations.
        if(!matchedMother){
            console.warn(`No mother with phone ${from} has an active enrollment!`);
            return res.status(200).send("OK");//always send ok to africastalking to prevent retries.
        }

        //insert the message and details into the database if mother is found.

        const receivedMessage = await insertMessage({
            enrollment_id: matchedEnrollment.enrollment_id,
            direction: 'INBOUND',
            message_type: 'CHECKIN_REPLY',
            content: text,
            channel: 'SMS',
            delivery_status: 'DELIVERED',
            //PARENT MESSAGE ID GOES HERE.
        });

        return res.status(200).send('OK');

    }catch(error){
        console.error('Inbound sms webhook error!',error);
        return res.status(200).send('OK');
    }
}