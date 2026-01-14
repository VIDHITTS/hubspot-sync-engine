const mongoose = require('mongoose');
const Conflict = require('./src/models/Conflict');
require('dotenv').config();

async function createConflict() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dummyId = new mongoose.Types.ObjectId();

        const mockConflict = {
            entityType: 'contact',
            localId: dummyId,
            hubspotId: '999_MOCK_TEST',
            // Using both fields to ensure UI compatibility
            localData: {
                firstname: 'Test',
                lastname: 'Local',
                email: 'conflict@test.com',
                phone: '111-1111',
                company: 'Local Inc'
            },
            hubspotData: {
                firstname: 'Test',
                lastname: 'Remote',
                email: 'conflict@test.com',
                phone: '222-2222',
                company: 'Remote Corp'
            },
            localSnapshot: { // For backward compat if UI uses this
                firstname: 'Test',
                lastname: 'Local',
                email: 'conflict@test.com'
            },
            remoteSnapshot: {
                firstname: 'Test',
                lastname: 'Remote',
                email: 'conflict@test.com'
            },
            status: 'PENDING',
            conflictMetadata: {
                type: 'SIMULATED',
                reason: 'User requested test conflict'
            }
        };

        const conflict = await Conflict.create(mockConflict);
        console.log('Mock conflict created successfully:', conflict._id);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error creating conflict:', error);
        process.exit(1);
    }
}

createConflict();
