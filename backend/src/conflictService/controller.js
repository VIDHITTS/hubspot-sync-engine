const service = require("./service");

const getAll = async (req, res) => {
  try {
    // Default to OPEN if no status specified, so resolved ones don't clutter the view
    const status = req.query.status || 'OPEN';
    const conflicts = await service.getAll(status);
    res.json(conflicts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const conflict = await service.getById(req.params.id);
    if (!conflict) {
      return res.status(404).json({ error: "Conflict not found" });
    }
    res.json(conflict);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resolve = async (req, res) => {
  try {
    const { resolutionStrategy, finalData } = req.body;

    if (!resolutionStrategy || !finalData) {
      return res.status(400).json({ error: "resolutionStrategy and finalData required" });
    }

    const conflict = await service.resolve(req.params.id, resolutionStrategy, finalData);
    res.json({ message: "Conflict resolved. Syncing new state...", conflict });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const keepLocal = async (req, res) => {
  try {
    const conflict = await service.resolveKeepLocal(req.params.id);
    res.json({ message: "Resolved: Kept local version", conflict });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const keepRemote = async (req, res) => {
  try {
    const conflict = await service.resolveKeepRemote(req.params.id);
    res.json({ message: "Resolved: Kept HubSpot version", conflict });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const merge = async (req, res) => {
  try {
    const { mergedData } = req.body;
    if (!mergedData) {
      return res.status(400).json({ error: "mergedData required" });
    }
    const conflict = await service.resolveMerge(req.params.id, mergedData);
    res.json({ message: "Resolved: Manual merge applied", conflict });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, resolve, keepLocal, keepRemote, merge };
