const Contact = require("../models/Contact");
const Company = require("../models/Company");
const Conflict = require("../models/Conflict");
const SyncLog = require("../models/SyncLog");
const hubspotContacts = require("../hubspotService/contacts");
const hubspotCompanies = require("../hubspotService/companies");
const { createHash, hasChanged } = require("./hash");

const syncContactToHubSpot = async (contactId) => {
  const contact = await Contact.findById(contactId);
  if (!contact) throw new Error("Contact not found");

  const syncData = {
    email: contact.email,
    firstname: contact.firstname,
    lastname: contact.lastname,
    phone: contact.phone,
    company: contact.company,
  };

  const startTime = Date.now();
  let hubspotResult;

  try {
    if (contact.hubspotId) {
      hubspotResult = await hubspotContacts.update(contact.hubspotId, syncData);
    } else {
      hubspotResult = await hubspotContacts.create(syncData);
      contact.hubspotId = hubspotResult.id;
    }

    contact.lastSyncedHash = createHash(syncData);
    contact.syncStatus = "SYNCED";
    contact.lastModifiedHubSpot = new Date();
    await contact.save();

    await SyncLog.create({
      entityType: "contact",
      entityId: contact._id,
      hubspotId: contact.hubspotId,
      action: contact.hubspotId ? "UPDATE" : "CREATE",
      direction: "OUTBOUND",
      status: "SUCCESS",
      dataAfter: syncData,
      duration: Date.now() - startTime,
    });

    return contact;
  } catch (error) {
    contact.syncStatus = "FAILED";
    await contact.save();

    await SyncLog.create({
      entityType: "contact",
      entityId: contact._id,
      action: "SYNC",
      direction: "OUTBOUND",
      status: "FAILED",
      error: { message: error.message },
      duration: Date.now() - startTime,
    });

    throw error;
  }
};

const checkTimeLock = (entity) => {
  const TIME_LOCK_WINDOW = 60000; // 60 seconds
  if (!entity.lastModifiedLocal) return false;
  const timeDiff = Date.now() - new Date(entity.lastModifiedLocal).getTime();
  return timeDiff <= TIME_LOCK_WINDOW;
};

const syncContactFromHubSpot = async (hubspotData) => {
  const hubspotId = hubspotData.id;
  const props = hubspotData.properties;

  const incomingData = {
    email: props.email,
    firstname: props.firstname || "",
    lastname: props.lastname || "",
    phone: props.phone || "",
    company: props.company || "",
  };

  let contact = await Contact.findOne({ hubspotId });

  if (!contact) {
    contact = await Contact.findOne({ email: props.email });
  }

  if (!contact) {
    contact = new Contact({
      ...incomingData,
      hubspotId,
      lastSyncedHash: createHash(incomingData),
      syncStatus: "SYNCED",
      lastModifiedHubSpot: new Date(),
    });
    await contact.save();
    return { action: "CREATED", contact };
  }

  // CHECK FOR ECHO
  if (!hasChanged(incomingData, contact.lastSyncedHash)) {
    return { action: "SKIPPED", reason: "No real change", contact };
  }

  // TIME-LOCK: 60s Buffer against rapid updates (Race Condition Guard)
  // Even if not strictly "PENDING", if it was modified < 60s ago, we block to be safe.
  const isTimeLocked = checkTimeLock(contact);

  if (contact.syncStatus === "PENDING" || isTimeLocked) {
    const conflictType = isTimeLocked ? "TIME-LOCK" : "CONCURRENT-EDIT";

    // Check if conflict already exists to prevent duplicates? 
    // Simplified: Just create new Conflict request

    const conflict = await Conflict.create({
      entityType: "contact",
      entityId: contact._id,
      hubspotId,
      localData: {
        email: contact.email,
        firstname: contact.firstname,
        lastname: contact.lastname,
        phone: contact.phone,
        company: contact.company,
      },
      hubspotData: incomingData,
      localModifiedAt: contact.lastModifiedLocal,
      hubspotModifiedAt: new Date(),
      status: "PENDING",
      conflictMetadata: {
        type: conflictType,
        reason: isTimeLocked ? "Local update within 60s window" : "Pending local changes",
      },
    });

    contact.syncStatus = "CONFLICT";
    await contact.save();

    return { action: "CONFLICT", conflict, contact };
  }

  Object.assign(contact, incomingData);
  contact.hubspotId = hubspotId;
  contact.lastSyncedHash = createHash(incomingData);
  contact.syncStatus = "SYNCED";
  contact.lastModifiedHubSpot = new Date();
  await contact.save();

  return { action: "UPDATED", contact };
};

const syncCompanyToHubSpot = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) throw new Error("Company not found");

  const syncData = {
    name: company.name,
    domain: company.domain,
    industry: company.industry,
    phone: company.phone,
    address: company.address,
  };

  const startTime = Date.now();
  let hubspotResult;

  try {
    if (company.hubspotId) {
      hubspotResult = await hubspotCompanies.update(
        company.hubspotId,
        syncData
      );
    } else {
      hubspotResult = await hubspotCompanies.create(syncData);
      company.hubspotId = hubspotResult.id;
    }

    company.lastSyncedHash = createHash(syncData);
    company.syncStatus = "SYNCED";
    company.lastModifiedHubSpot = new Date();
    await company.save();

    await SyncLog.create({
      entityType: "company",
      entityId: company._id,
      hubspotId: company.hubspotId,
      action: company.hubspotId ? "UPDATE" : "CREATE",
      direction: "OUTBOUND",
      status: "SUCCESS",
      dataAfter: syncData,
      duration: Date.now() - startTime,
    });

    return company;
  } catch (error) {
    company.syncStatus = "FAILED";
    await company.save();

    await SyncLog.create({
      entityType: "company",
      entityId: company._id,
      action: "SYNC",
      direction: "OUTBOUND",
      status: "FAILED",
      error: { message: error.message },
      duration: Date.now() - startTime,
    });

    throw error;
  }
};

const syncCompanyFromHubSpot = async (hubspotData) => {
  const hubspotId = hubspotData.id;
  const props = hubspotData.properties;

  const incomingData = {
    name: props.name || props.domain || "Unnamed Company",
    domain: props.domain || "",
    industry: props.industry || "",
    phone: props.phone || "",
    address: props.address || "",
  };

  let company = await Company.findOne({ hubspotId });

  if (!company && props.domain) {
    company = await Company.findOne({ domain: props.domain });
  }

  if (!company) {
    company = new Company({
      ...incomingData,
      hubspotId,
      lastSyncedHash: createHash(incomingData),
      syncStatus: "SYNCED",
      lastModifiedHubSpot: new Date(),
    });
    await company.save();
    return { action: "CREATED", company };
  }

  // CHECK FOR ECHO
  if (!hasChanged(incomingData, company.lastSyncedHash)) {
    return { action: "SKIPPED", reason: "No real change (echo)", company };
  }

  // TIME-LOCK
  const isTimeLocked = checkTimeLock(company);

  if (company.syncStatus === "PENDING" || isTimeLocked) {
    const conflictType = isTimeLocked ? "TIME-LOCK" : "CONCURRENT-EDIT";

    const conflict = await Conflict.create({
      entityType: "company",
      entityId: company._id,
      hubspotId,
      localData: {
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        phone: company.phone,
        address: company.address,
      },
      hubspotData: incomingData,
      localModifiedAt: company.lastModifiedLocal,
      hubspotModifiedAt: new Date(),
      status: "PENDING",
      conflictMetadata: {
        type: conflictType,
        reason: isTimeLocked ? "Local update within 60s window" : "Pending local changes",
      },
    });

    company.syncStatus = "CONFLICT";
    await company.save();

    return { action: "CONFLICT", conflict, company };
  }

  Object.assign(company, incomingData);
  company.hubspotId = hubspotId;
  company.lastSyncedHash = createHash(incomingData);
  company.syncStatus = "SYNCED";
  company.lastModifiedHubSpot = new Date();
  await company.save();

  return { action: "UPDATED", company };
};

// === BULK SYNC ===

const syncAllPendingToHubSpot = async () => {
  const pendingContacts = await Contact.find({ syncStatus: "PENDING" });
  const pendingCompanies = await Company.find({ syncStatus: "PENDING" });

  const results = { contacts: [], companies: [] };

  for (const contact of pendingContacts) {
    try {
      await syncContactToHubSpot(contact._id);
      results.contacts.push({ id: contact._id, status: "success" });
    } catch (error) {
      results.contacts.push({
        id: contact._id,
        status: "failed",
        error: error.message,
      });
    }
  }

  for (const company of pendingCompanies) {
    try {
      await syncCompanyToHubSpot(company._id);
      results.companies.push({ id: company._id, status: "success" });
    } catch (error) {
      results.companies.push({
        id: company._id,
        status: "failed",
        error: error.message,
      });
    }
  }

  return results;
};

const pullAllFromHubSpot = async () => {
  const hubspotContactsList = await hubspotContacts.getAll();
  const hubspotCompaniesList = await hubspotCompanies.getAll();

  const results = { contacts: [], companies: [] };

  for (const hsContact of hubspotContactsList) {
    const result = await syncContactFromHubSpot(hsContact);
    results.contacts.push(result);
  }

  for (const hsCompany of hubspotCompaniesList) {
    const result = await syncCompanyFromHubSpot(hsCompany);
    results.companies.push(result);
  }

  return results;
};

module.exports = {
  syncContactToHubSpot,
  syncContactFromHubSpot,
  syncCompanyToHubSpot,
  syncCompanyFromHubSpot,
  syncAllPendingToHubSpot,
  pullAllFromHubSpot,
};
