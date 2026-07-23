import { smsService } from '../config/africastalking.js';


//function that actually sends the message.

export const  sendSms = async (phoneNumber: string , message: string ) => {
    const response = await smsService.send({
        to: phoneNumber,
        message: message
    });

    const recipientResult = response.SMSMessageData.Recipients[0];

    //check that the message was sent successfully.
    if(!recipientResult || recipientResult.status !== "Success"){
        throw new Error(`SMS Failed to send to ${phoneNumber}`);
    }

    return{
        messageId: recipientResult.messageId,
        status: recipientResult.status,
        cost: recipientResult.cost,
        number: recipientResult.number
    }
}