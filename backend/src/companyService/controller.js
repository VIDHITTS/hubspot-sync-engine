const service = require("./service");

const getAll = async (req, res) => {
  try {
    const companies = await service.getAll();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const company = await service.getById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const company = await service.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Domain already exists" });
    }
    res.status(400).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const company = await service.update(req.params.id, req.body);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const company = await service.remove(req.params.id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json({ message: "Company deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
