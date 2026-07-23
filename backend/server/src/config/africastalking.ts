//configuring africastalking to get the smsService
import  africastalking from 'africastalking';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.AFRICASTALKING_SANDBOX_API_KEY;
const username = process.env.AFRICASTALKING_SANDBOX_USERNAME;

if(!apiKey || !username ){
    throw new Error("Africa's Talking credentials are not defined!");
}

const AT = africastalking({
    apiKey,
    username,
});


//export only the sms service since AT has all the services

export const smsService = AT.SMS;