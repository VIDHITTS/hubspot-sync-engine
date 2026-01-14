const Contact = require("../models/Contact");

const getAll = async () => {
  return await Contact.find().sort({ createdAt: -1 });
};

const getById = async (id) => {
  return await Contact.findById(id);
};

const create = async (data) => {
  const contact = new Contact({
    ...data,
    lastModifiedLocal: new Date(),
    syncStatus: "NEW",
  });
  return await contact.save();
};

const update = async (id, data) => {
  const contact = await Contact.findById(id);
  if (!contact) return null;

  Object.assign(contact, data);
  contact.lastModifiedLocal = new Date();
  if (contact.hubspotId) {
    contact.syncStatus = "PENDING";
  }

  return await contact.save();
};

const remove = async (id) => {
  return await Contact.findByIdAndDelete(id);
};

module.exports = { getAll, getById, create, update, remove };
