const mongoose = require("mongoose");

const ConflictSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["contact", "company"],
      required: true,
    },
    localId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    hubspotId: {
      type: String,
      required: true,
    },
    // Supporting both naming conventions for safety/migration
    localSnapshot: { type: mongoose.Schema.Types.Mixed },
    remoteSnapshot: { type: mongoose.Schema.Types.Mixed },
    localData: { type: mongoose.Schema.Types.Mixed },
    hubspotData: { type: mongoose.Schema.Types.Mixed },

    conflictMetadata: {
      type: Map,
      of: String,
      default: {}
    },

    status: {
      type: String,
      enum: ["OPEN", "PENDING", "RESOLVED"], // Added PENDING
      default: "OPEN",
    },
    resolutionStrategy: {
      type: String,
      enum: ["KEEP_LOCAL", "KEEP_REMOTE", "MANUAL_MERGE", null],
      default: null,
    },
    resolvedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ConflictSchema.index({ status: 1 });
ConflictSchema.index({ entityType: 1, localId: 1 });
ConflictSchema.index({ detectedAt: -1 });

module.exports = mongoose.model("Conflict", ConflictSchema);
