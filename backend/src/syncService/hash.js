const crypto = require("crypto");

const createHash = (data) => {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("md5").update(normalized).digest("hex");
};

const hasChanged = (newData, storedHash) => {
  if (!storedHash) return true;
  const newHash = createHash(newData);
  return newHash !== storedHash;
};

module.exports = { createHash, hasChanged };
