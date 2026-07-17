export const isValidEmail = (email: string): boolean => {
    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email.trim().toLowerCase());
};

export const isValidPhone = (phone: string): boolean => {
    // Kenyan numbers:
    // 07XXXXXXXX
    // 01XXXXXXXX
    // +2547XXXXXXXX
    // +2541XXXXXXXX

    const phoneRegex =
        /^(?:\+254|0)(7\d{8}|1\d{8})$/;

    return phoneRegex.test(phone.trim());
};

export const isStrongPassword = (
    password: string
): boolean => {

    return password.length >= 8;

};