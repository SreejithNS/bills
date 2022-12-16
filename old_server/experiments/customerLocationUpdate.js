require("dotenv").config(
    {
        path: "../.env"
    }
);
const papa = require("papaparse");
const fs = require("fs");

const MONGO_URL = process.env.MONGODB_URL;

const mongoose = require("mongoose");


const dataStream = fs.createReadStream("./zone_centers.csv");
const parseStream = papa.parse(papa.NODE_STREAM_INPUT, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
});

dataStream.pipe(parseStream);

let data = [];
parseStream.on("data", chunk => {
    data.push(chunk);
});

parseStream.on("finish", () => {
    console.log(data);
    console.log(data.length);

    const filteredData = data.filter(d => d.distanceFromTheNearestPointToTheCenter < 400 && d.validBillsCount > 3);

    mongoose.connect(MONGO_URL).then(async (instance) => {
        console.log("Connected to MongoDB");

        const db = instance.connection;

        let itereation = 0;
        let matchedCount = 0;
        let modifiedCount = 0;
        let errorCustomer = [];

        for (const customer of filteredData) {
            itereation++;
            console.log(`Now ${itereation}/${filteredData.length}`);

            try {
                const location = customer.nearestPointToTheCenter.split(";").map(d => parseFloat(d)).reverse();

                console.log(customer.customer, location);

                const updatedResult = await db.collection("customers").updateOne({
                    _id: new mongoose.Types.ObjectId(customer.customer)
                }, {
                    $set: {
                        location: {
                            type: "Point",
                            coordinates: location
                        }
                    }
                });

                modifiedCount += updatedResult.modifiedCount;
                matchedCount += updatedResult.matchedCount;
            } catch (e) {
                console.error(e);
                errorCustomer.push(customer.customer);
                continue;
            }

            console.log(`Progress ${((itereation / filteredData.length) * 100).toFixed(2)}%`);
        }

        console.log(`Matched: ${matchedCount}`);
        console.log(`Modified: ${modifiedCount}`);
        console.log(`Untouched Percentage: ${((modifiedCount / filteredData.length) * 100).toFixed(2)}%`);
        console.log(`Touched Percentage: ${((modifiedCount / filteredData.length) * 100).toFixed(2)}%`);

        if (errorCustomer.length > 0) {
            console.log(`Error Customers: ${errorCustomer.map(c => c.name + ";" + c.customer).join("\n")}`);
        }
        await instance.disconnect();
        return process.exit(0);
    });
});