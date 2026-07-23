import pool from '../config/db.js';


//message has no mother id nor org id so we join it with enrollment as it has enrollment id.

export const getConversationHistoryById = async (mother_id: string , organization_id: string ) => {
    const result = await pool.query(
        `SELECT m.*
         FROM message m 
         JOIN enrollment e ON m.enrollment_id = e.enrollment_id
         WHERE e.mother_id = $1 AND e.organization_id = $2
         ORDER BY m.created_at ASC`, //from oldest to newest.
         [mother_id , organization_id]
    );

    return result.rows;
}


interface insertMessageData{
    enrollment_id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    message_type: 'CHECKIN_QUESTION' | 'CHECKIN_REPLY' | 'UNPROMPTED';
    content: string;
    channel: 'SMS' | 'WHATSAPP';
    delivery_status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
    parent_message_id?: string;
}

//inserting a message in the database.

export const insertMessage = async ( data: insertMessageData) => {
    const result = await pool.query(
        `INSERT INTO message
            (
            enrollment_id,
            direction,
            message_type,
            content,
            channel,
            delivery_status,
            parent_message_id,
            sent_at
            )
            VALUES($1,$2,$3,$4,$5,$6,$7,NOW())
            RETURNING *`,
            [
                data.enrollment_id,
                data.direction,
                data.message_type,
                data.content,
                data.channel,
                data.delivery_status,
                data.parent_message_id ?? null
            ]
    );

    return result.rows[0];
}


//function to find mother by phone only.

export const findMotherByPhoneOnly = async (phone: string ) => {
    const result = await pool.query(
        `SELECT * FROM mother
         WHERE phone = $1`,
         [phone.trim()]
    );

    return result.rows;
}