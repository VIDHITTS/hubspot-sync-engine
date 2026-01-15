require("dotenv").config();
const mongoose = require("mongoose");
const Conflict = require("./src/models/Conflict");
const Contact = require("./src/models/Contact");

async function createMockConflicts() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Create contacts first (if they don't exist)
    const contacts = [
        { email: "michael.scott@dundermifflin.com", firstname: "Michael", lastname: "Scott", phone: "555-0100", company: "Dunder Mifflin" },
        { email: "jim.halpert@dundermifflin.com", firstname: "Jim", lastname: "Halpert", phone: "555-0101", company: "Dunder Mifflin" },
        { email: "pam.beesly@dundermifflin.com", firstname: "Pam", lastname: "Beesly", phone: "555-0102", company: "Dunder Mifflin" },
        { email: "dwight.schrute@dundermifflin.com", firstname: "Dwight", lastname: "Schrute", phone: "555-0103", company: "Schrute Farms" },
        { email: "andy.bernard@dundermifflin.com", firstname: "Andy", lastname: "Bernard", phone: "555-0104", company: "Dunder Mifflin" },
    ];

    for (const c of contacts) {
        const existing = await Contact.findOne({ email: c.email });
        if (!existing) {
            await Contact.create({
                ...c,
                hubspotId: `hs-demo-${Math.random().toString(36).substr(2, 9)}`,
                syncStatus: "CONFLICT",
                lastModifiedLocal: new Date(),
            });
            console.log(`Created contact: ${c.email}`);
        }
    }

    // Get all contacts to create conflicts
    const allContacts = await Contact.find({ email: { $regex: /dundermifflin/ } });

    // Create conflicts for each
    const conflictData = [
        { local: { lastname: "Scott" }, remote: { lastname: "Gary Scott" } },
        { local: { phone: "555-0101" }, remote: { phone: "555-9999" } },
        { local: { lastname: "Beesly" }, remote: { lastname: "Halpert" } },
        { local: { company: "Schrute Farms" }, remote: { company: "Dunder Mifflin" } },
        { local: { firstname: "Andy" }, remote: { firstname: "Andrew" } },
    ];

    for (let i = 0; i < Math.min(allContacts.length, conflictData.length); i++) {
        const contact = allContacts[i];
        const data = conflictData[i];

        // Check if conflict already exists
        const existing = await Conflict.findOne({ localId: contact._id, status: "OPEN" });
        if (existing) {
            console.log(`Conflict already exists for: ${contact.email}`);
            continue;
        }

        await Conflict.create({
            entityType: "contact",
            localId: contact._id,
            hubspotId: contact.hubspotId,
            localSnapshot: {
                firstname: contact.firstname,
                lastname: data.local.lastname || contact.lastname,
                email: contact.email,
                phone: data.local.phone || contact.phone,
                company: data.local.company || contact.company,
            },
            remoteSnapshot: {
                firstname: data.remote.firstname || contact.firstname,
                lastname: data.remote.lastname || contact.lastname,
                email: contact.email,
                phone: data.remote.phone || contact.phone,
                company: data.remote.company || contact.company,
            },
            status: "OPEN",
            detectedAt: new Date(),
        });
        console.log(`Created conflict for: ${contact.email}`);
    }

    const count = await Conflict.countDocuments({ status: "OPEN" });
    console.log(`\n✅ Total OPEN conflicts: ${count}`);

    await mongoose.disconnect();
    process.exit(0);
}

createMockConflicts().catch(console.error);
