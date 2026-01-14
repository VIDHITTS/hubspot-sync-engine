const express = require("express");
const router = express.Router();
const syncService = require("./service");

// Manual sync single contact to HubSpot
router.post("/contacts/:id/to-hubspot", async (req, res) => {
  try {
    const result = await syncService.syncContactToHubSpot(req.params.id);
    res.json({ success: true, contact: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual sync single company to HubSpot
router.post("/companies/:id/to-hubspot", async (req, res) => {
  try {
    const result = await syncService.syncCompanyToHubSpot(req.params.id);
    res.json({ success: true, company: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync all pending changes to HubSpot
router.post("/push-all", async (req, res) => {
  try {
    const results = await syncService.syncAllPendingToHubSpot();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pull all from HubSpot
router.post("/pull-all", async (req, res) => {
  try {
    const results = await syncService.pullAllFromHubSpot();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
