// Company service middleware

const validateCompanyData = (req, res, next) => {
  const { name } = req.body;
  if (req.method === "POST" && !name) {
    return res.status(400).json({ error: "Company name is required" });
  }
  next();
};

module.exports = {
  validateCompanyData,
};
