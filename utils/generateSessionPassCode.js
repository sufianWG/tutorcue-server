const crypto = require("crypto");
const generateSessionPassCode = () => {
    const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `TC-${randomCode}`;
};
module.exports = generateSessionPassCode;