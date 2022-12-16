require("dotenv").config(
    {
        path: "../.env"
    }
);

const geo = require("geolib");

const papa = require("papaparse");
const fs = require("fs");

const MONGO_URL = process.env.MONGODB_URL;

const mongoose = require("mongoose");

mongoose.connect(MONGO_URL).then(async (instance) => {
    console.log("Connected to MongoDB");

    const db = instance.connection;
    const customers = await db.collection("customers").find({}).toArray();

    console.log(`Found ${customers.length} customers with location data`);

    const results = [];

    let iteration = 1;

    for (const customer of customers) {
        console.log("Progress: " + (iteration / customers.length * 100).toFixed(2) + "%");
        console.log("Count:" + `${iteration}/${customers.length}`);
        iteration++;

        const {
            _id,
            name
        } = customer;

        let billLocations;
        try {
            billLocations = await db.collection("bills").find(
                {
                    customer: _id,
                    
                    location: {
                        $exists: true
                    }
                }, {
                projection: {
                    location: 1
                }
            }
            ).toArray();
        } catch (error) {
            console.error(error);
            continue;
        }

        if (billLocations.length === 0) continue;

        billLocations = billLocations.map(doc => ({
            latitude: doc.location.coordinates[0],
            longitude: doc.location.coordinates[1]
        })).filter(loc =>
            !(geo.isPointWithinRadius(loc, {
                latitude: 12.490548698135102, longitude: 78.56004911534038
            }, 400))
        );

        if (billLocations.length === 0) continue;

        let zoneCenter = geo.getCenterOfBounds(billLocations);

        let nearestPointToTheCenter = geo.findNearest(zoneCenter, billLocations);

        let distanceFromTheNearestPointToTheCenter = geo.getDistance(nearestPointToTheCenter, zoneCenter);


        const result = {
            customer: _id,
            name: name,
            zoneCenter: `${zoneCenter.latitude}; ${zoneCenter.longitude}`,
            nearestPointToTheCenter: `${nearestPointToTheCenter.latitude}; ${nearestPointToTheCenter.longitude}`,
            distanceFromTheNearestPointToTheCenter,
            validBillsCount: billLocations.length
        };

        results.push(result);
        console.table(result);
    }

    if (results.length > 0) {
        console.log("Writing results to file");

        try {

            const csv = papa.unparse(results);

            // write csv to a file
            fs.writeFileSync("zone_centers.csv", csv);
        } catch (error) {
            console.error(error);
        }
    } else {
        console.log("No results");
    }

    console.log("Done");
    process.exit();
});