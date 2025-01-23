const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;


// Get collection helper
const getCollection = (collection) => {
  return mongoose.connection.db.collection(collection);
};

// Get all locations from a collection
router.get('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    console.log('Fetching locations from collection:', collection);

    const db = mongoose.connection.db;
    // console.log('Available collections:', await db.listCollections().toArray());

    const coll = db.collection(collection);
    const locations = await coll.find().toArray();
    console.log(`Found ${locations.length} locations in ${collection}`);
    // console.log('First location (if any):', locations[0]);

    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Create a new location in a collection
router.post('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const locationData = req.body;

    console.log('Creating location in collection:', collection);
    console.log('Location data:', locationData);

    const result = await getCollection(collection).insertOne(locationData);
    const createdLocation = await getCollection(collection).findOne({ _id: result.insertedId });

    res.json(createdLocation);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Batch create locations in a collection
router.post('/:collection/batch', async (req, res) => {
  try {
    const { collection } = req.params;
    const { locations } = req.body;

    console.log(`Batch creating ${locations.length} locations in collection:`, collection);

    const result = await getCollection(collection).insertMany(locations);
    res.json({ message: `Successfully created ${result.insertedCount} locations` });
  } catch (error) {
    console.error('Error batch creating locations:', error);
    res.status(500).json({ error: 'Failed to create locations' });
  }
});

// Update a location in a collection
router.put('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const locationData = req.body;

    console.log('PUT request received:');
    console.log('Collection:', collection);
    console.log('ID:', id);
    console.log('Data:', locationData);

    const coll = getCollection(collection);

    // Try to find with string ID first
    console.log('Attempting to find with string ID:', id);
    let existingDoc = await coll.findOne({ _id: id });
    console.log('Found with string ID:', existingDoc);

    // Try with ObjectId
    if (!existingDoc) {
      console.log('Attempting to find with ObjectId');
      const objectId = new ObjectId(id);
      console.log('Converted to ObjectId:', objectId);
      existingDoc = await coll.findOne({ _id: objectId });
      console.log('Found with ObjectId:', existingDoc);
    }

    if (!existingDoc) {
      // Let's log all documents in the collection to debug
      const allDocs = await coll.find().toArray();
      console.log('All documents in collection:', collection);
      console.log('Document count:', allDocs.length);
      console.log('First few documents:', allDocs.slice(0, 3));
      console.log('Document IDs:', allDocs.map(doc => doc._id));

      console.error('Location not found with either string or ObjectId');
      return res.status(404).json({ error: 'Location not found' });
    }

    // Use the same type of ID that worked for finding
    const idToUse = existingDoc._id;
    console.log('Using ID type:', typeof idToUse, idToUse);

    const result = await coll.updateOne(
      { _id: idToUse },
      { $set: locationData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      console.error('Update failed - no document matched');
      return res.status(404).json({ error: 'Location not found' });
    }

    // Fetch the updated document
    const updatedLocation = await coll.findOne({ _id: idToUse });
    console.log('Updated location:', updatedLocation);
    res.json(updatedLocation);
  } catch (error) {
    console.error('Error updating location:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Delete locations from a collection
router.delete('/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { ids } = req.body;

    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    const result = await getCollection(collection).deleteMany({ _id: { $in: objectIds } });

    res.json({ message: `Successfully deleted ${result.deletedCount} locations` });
  } catch (error) {
    console.error('Error deleting locations:', error);
    res.status(500).json({ error: 'Failed to delete locations' });
  }
});

// Move a location from one collection to another
router.post('/:fromCollection/:id/move/:toCollection', async (req, res) => {
  try {
    const { fromCollection, id, toCollection } = req.params;
    const { approved_by, approved_datetime } = req.body;
    console.log('Moving location:', { fromCollection, id, toCollection, approved_by, approved_datetime });

    const db = mongoose.connection.db;
    const fromColl = db.collection(fromCollection);
    const toColl = db.collection(toCollection);

    const location = await fromColl.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!location) {
      console.error('Location not found for move:', { id, fromCollection });
      return res.status(404).json({ error: 'Location not found' });
    }

    // Add approval fields when moving to reviewed_data
    if (toCollection === 'reviewed_data') {
      if (!approved_by || !approved_datetime) {
        return res.status(400).json({ error: 'Approval information is required' });
      }
      location.approved_by = approved_by;
      location.approved_datetime = new Date(approved_datetime);
    }

    await toColl.insertOne(location);
    await fromColl.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

    console.log('Moved location:', location);
    res.json(location);
  } catch (error) {
    console.error('Error moving location:', error);
    res.status(500).json({ error: 'Failed to move location' });
  }
});

module.exports = router; 