const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        //Step 2: task 1 - insert code here
        const db = await connectToDatabase();

        //Step 2: task 2 - insert code here
        const collection = db.collection("secondChanceItems");
        
        //Step 2: task 3 - insert code here
        const secondChanceItems = await collection.find({}).toArray();
        
        //Step 2: task 4 - insert code here
        res.json(secondChanceItems);
    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async(req, res,next) => {
    try {

        //Step 3: task 1 - insert code here
        const db = await connectToDatabase();

        //Step 3: task 2 - insert code here
        const collection = db.collection("secondChanceItems");

        //Step 3: task 3 - insert code here
        let secondChanceItem = req.body;

        //Step 3: task 4 - insert code here
        const lastItemQuery = await collection.find().sort({id: -1}).limit(1).toArray();
        if(lastItemQuery.length > 0){
            secondChanceItem.id = (parseInt(lastItem[0].id) + 1).toString();
        } else {
            secondChanceItem.id = '1';
        }
        // await lastItemQuery.forEach(item => {
        //     secondChanceItem.id = (parseInt(item.id)+1),tiString();
        // })
        //Step 3: task 5 - insert code here
        const date_added = Math.floor(Date.now() / 1000);
        secondChanceItem.date_added = date_added;

        // Task 6: Add the secondChanceItem to the database
        const result = await collection.insertOne(secondChanceItem);

        // Update file 
        if (req.file) { 
            secondChanceItem.filePath = req.file.path; 
            secondChanceItem.fileName = req.file.filename; 
            await collection.updateOne({ _id: result.insertedId }, { $set: { filePath: secondChanceItem.filePath, fileName: secondChanceItem.fileName } });
        }

        res.status(201).json({...result.ops[0],
            filePath: secondChanceItem.filePath, 
            fileName: secondChanceItem.fileName});
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        //Step 4: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 4: task 2 - insert code here
        const collection = db.collection("secondChanceItems");
        //Step 4: task 3 - insert code here
        const item = await collection.findOne({ id: id});
        //Step 4: task 4 - insert code here
        if(!item){
            return res.status(404).send("secondChanceItem not found");
        }

        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Update an existing item
router.put('/:id', async (req, res, next) => {
    try {
        // Step 5: task 1 - insert code here
        const db = await connectToDatabase(); // Ensure you wait for the db connection

        // Step 5: task 2 - insert code here
        const collection = db.collection("secondChanceItems");

        // Get the ID from the request parameters
        const { id } = req.params; // Destructure id from req.params

        // Step 5: task 3 - insert code here
        const existingItem = await collection.findOne({ id: id });

        if (!existingItem) {
            logger.error('The item of this Id not found');
            return res.status(404).json({ error: "The item of this Id not found" });
        }

        // Step 5: Update the existing item with the new data from the request body
        const updatedData = {
            category: req.body.category,
            condition: req.body.condition,
            age_days: req.body.age_days,
            description: req.body.description,
            age_years: Number((req.body.age_days / 365).toFixed(1)), // Calculate age in years
            updatedAt: new Date() 
        };

        // Task: Use findOneAndUpdate to update the document and return the updated document
        const updateResult = await collection.findOneAndUpdate(
            { id: id },
            { $set: updatedData },
            { returnDocument: 'after' } 
        );

        // Check if the item was updated
        if (!updateResult) {
            logger.warn('No changes were made to the item');
            return res.status(400).json({ error: "No changes were made to the item" });
        }

        if(updateResult) {
            res.json({"uploaded":"success"});
        } else {
            res.json({"uploaded":"failed"});
        }

        res.status(200).json({ message: "Item updated successfully", updatedItem: updateResult });
    } catch (e) {
        next(e);
    }
});



// Delete an existing item
router.delete('/:id', async(req, res,next) => {
    try {
        //Step 6: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 6: task 2 - insert code here
        const collection = db.collection("secondChanceItems");
        //Step 6: task 3 - insert code here
        const item = await collection.findOne({ id: id});
        if(!item){
            logger.error('Item is not found');
            return res.status(404).json({ error: "Item is not found"});
        }
        //Step 6: task 4 - insert code here
        await collection.deleteOne({ id: id });
        res.json({"deleted":"success"});
    } catch (e) {
        next(e);
    }
});

module.exports = router;
