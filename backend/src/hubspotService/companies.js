const client = require("./client");

const COMPANIES_ENDPOINT = "/crm/v3/objects/companies";

const getAll = async (limit = 100) => {
  const result = await client.get(
    `${COMPANIES_ENDPOINT}?limit=${limit}&properties=name,domain,industry,phone,address`
  );
  return result.results || [];
};

const getById = async (hubspotId) => {
  return await client.get(
    `${COMPANIES_ENDPOINT}/${hubspotId}?properties=name,domain,industry,phone,address`
  );
};

const create = async (companyData) => {
  return await client.post(COMPANIES_ENDPOINT, {
    properties: {
      name: companyData.name,
      domain: companyData.domain || "",
      industry: companyData.industry || "",
      phone: companyData.phone || "",
      address: companyData.address || "",
    },
  });
};

const update = async (hubspotId, companyData) => {
  return await client.patch(`${COMPANIES_ENDPOINT}/${hubspotId}`, {
    properties: {
      name: companyData.name,
      domain: companyData.domain || "",
      industry: companyData.industry || "",
      phone: companyData.phone || "",
      address: companyData.address || "",
    },
  });
};

const remove = async (hubspotId) => {
  return await client.del(`${COMPANIES_ENDPOINT}/${hubspotId}`);
};

const search = async (domain) => {
  const result = await client.post(`${COMPANIES_ENDPOINT}/search`, {
    filterGroups: [
      {
        filters: [
          {
            propertyName: "domain",
            operator: "EQ",
            value: domain,
          },
        ],
      },
    ],
  });
  return result.results?.[0] || null;
};

module.exports = { getAll, getById, create, update, remove, search };
