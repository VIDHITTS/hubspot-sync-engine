const client = require("./client");

const CONTACTS_ENDPOINT = "/crm/v3/objects/contacts";

const getAll = async (limit = 100) => {
  const result = await client.get(
    `${CONTACTS_ENDPOINT}?limit=${limit}&properties=email,firstname,lastname,phone,company`
  );
  return result.results || [];
};

const getById = async (hubspotId) => {
  return await client.get(
    `${CONTACTS_ENDPOINT}/${hubspotId}?properties=email,firstname,lastname,phone,company`
  );
};

const create = async (contactData) => {
  return await client.post(CONTACTS_ENDPOINT, {
    properties: {
      email: contactData.email,
      firstname: contactData.firstname || "",
      lastname: contactData.lastname || "",
      phone: contactData.phone || "",
      company: contactData.company || "",
    },
  });
};

const update = async (hubspotId, contactData) => {
  return await client.patch(`${CONTACTS_ENDPOINT}/${hubspotId}`, {
    properties: {
      email: contactData.email,
      firstname: contactData.firstname || "",
      lastname: contactData.lastname || "",
      phone: contactData.phone || "",
      company: contactData.company || "",
    },
  });
};

const remove = async (hubspotId) => {
  return await client.del(`${CONTACTS_ENDPOINT}/${hubspotId}`);
};

const search = async (email) => {
  const result = await client.post(`${CONTACTS_ENDPOINT}/search`, {
    filterGroups: [
      {
        filters: [
          {
            propertyName: "email",
            operator: "EQ",
            value: email,
          },
        ],
      },
    ],
  });
  return result.results?.[0] || null;
};

module.exports = { getAll, getById, create, update, remove, search };
