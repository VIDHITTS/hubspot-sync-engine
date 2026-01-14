const Company = require("../models/Company");

const getAll = async () => {
  return await Company.find().sort({ createdAt: -1 });
};

const getById = async (id) => {
  return await Company.findById(id);
};

const create = async (data) => {
  const company = new Company({
    ...data,
    lastModifiedLocal: new Date(),
    syncStatus: "NEW",
  });
  return await company.save();
};

const update = async (id, data) => {
  const company = await Company.findById(id);
  if (!company) return null;

  Object.assign(company, data);
  company.lastModifiedLocal = new Date();
  if (company.hubspotId) {
    company.syncStatus = "PENDING";
  }

  return await company.save();
};

const remove = async (id) => {
  return await Company.findByIdAndDelete(id);
};

module.exports = { getAll, getById, create, update, remove };
