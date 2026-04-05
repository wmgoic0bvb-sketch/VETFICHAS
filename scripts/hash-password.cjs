const bcrypt = require("bcryptjs");

const pwd = process.argv[2];
if (!pwd) {
  console.error("Usage: node scripts/hash-password.cjs <password>");
  process.exit(1);
}

bcrypt.hash(pwd, 10).then((hash) => {
  console.log(hash);
});
