import type { Request , Response } from 'express';
import { getConversationHistoryById , insertMessage } from '../services/messages.service.js';
import { findActiveEnrollmentByMother } from '../services/enrollment.service.js';
import { findMotherById } from '../services/mothers.service.js';
import { sendSms } from '../services/sms.service.js';


//============== GET messages by  mother id =========//


export const getMessages = async (req: Request , res: Response ) => {
    try{
        //check authentication.

        if(!req.user){
            return res.status(401).json({
                success:false,
                message: "Not Authenticated!"
            })
        }

        const id = req.params.id as string;

        const organization_id = req.user.organization_id;

        const conversation = await getConversationHistoryById(id,organization_id);

        return res.status(200).json({
            success:true,
            message: " Conversation acquired successfully!",
            data: conversation
        })
    }catch(error){
        console.error('Fetch conversation error:',error);
        return res.status(500).json({
            success:false,
            message: "Failed to fetch conversation!"
        })
    }
}


//========post manual outreach controller============//


export const sendOutboundManualMessage = async ( req: Request , res: Response ) => {
    try{
        //confirm authentication as always.
        if(!req.user){
            return res.status(401).json({
                success:false,
                message: "Not Authenticated!"
            });
        }

        const { message } = req.body;

        if(!message){
            return res.status(400).json({
                success:false,
                message: " The message to be sent is required!"
            })
        }

        //get id and organization id.
        const mother_id = req.params.id as string;
        const organization_id = req.user.organization_id;


        //confirm the mother actually exists in the organization.
        const mother = await findMotherById(mother_id , organization_id);

        if(!mother){
            return res.status(404).json({
                success:false,
                message: "Mother not found!"
            })
        }

        //before sending the message we need to know the actual enrollment 
        //to send to since a mother can have multiple.

        const enrollment = await findActiveEnrollmentByMother(mother_id,organization_id);

        if(!enrollment){
            return res.status(404).json({
                success:false,
                message: "No active enrollment found for this mother!"
            })
        }

        //sending the message.

        const smsResult = await sendSms(mother.phone,message);

        //inserting the outbound message in the database.

        const savedMessage = await insertMessage({
            enrollment_id: enrollment.enrollment_id,
            direction: 'OUTBOUND',
            message_type: 'UNPROMPTED',
            content: message,
            channel: 'SMS',
            delivery_status: smsResult.status === 'Success' ? 'SENT' : 'FAILED'

        });

        return res.status(201).json({
            success:true,
            message: "Message sent successfully!",
            data: savedMessage
        });


    }catch(error){
        console.error("An error occurred while trying to send the message!",error);
        return res.status(500).json({
            success:false,
            message:"Failed to send message!"
        })
    }
}