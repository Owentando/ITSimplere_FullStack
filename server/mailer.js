const nodemailer = require("nodemailer");

function createSmtpTransport() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
        return null;
    }

    if (Boolean(user) !== Boolean(password)) {
        throw new Error("SMTP_USER and SMTP_PASS must both be configured");
    }

    let secure = port === 465;
    if (process.env.SMTP_SECURE !== undefined) {
        if (!["true", "false"].includes(process.env.SMTP_SECURE.toLowerCase())) {
            throw new Error("SMTP_SECURE must be true or false");
        }
        secure = process.env.SMTP_SECURE.toLowerCase() === "true";
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        ...(user ? { auth: { user, pass: password } } : {})
    });
}

module.exports = createSmtpTransport;
