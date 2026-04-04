const crypto = require("crypto");

const secret = crypto.randomBytes(32).toString("base64url");
console.log(secret);
console.log("");
console.log("Copiá esta línea en .env.local:");
console.log(`AUTH_SECRET=${secret}`);
