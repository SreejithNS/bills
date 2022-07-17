const { chai, server } = require("./testConfig");
const { createProduct, createCategory } = require("../controllers/ProductController");
const { GST } = require("../controllers/sales/GST");
const expect = require("chai").expect;
const { faker } = require("@faker-js/faker");
const { createUser, userAuthentication } = require("../controllers/AuthController");
const { privilegeEnum } = require("../helpers/privilegeEnum");
const { createCustomer } = require("../controllers/CustomerController");
const { Bill } = require("../models/BillModel");

describe("GST", () => {
    describe("Unit Tests", () => {
        it("Calculates tax amount and slabs correctly", async () => {
            /**
             * @type {import("../controllers/sales/GST").GSTProduct[]}
             */
            const products = [
                {
                    name: Math.random().toString(),
                    amount: 100,
                    sgst: 10,
                    cgst: 0,
                    gstInclusive: true,
                },
                {
                    name: Math.random().toString(),
                    amount: 100,
                    sgst: 10,
                    cgst: 20,
                    gstInclusive: false,
                },
            ];
            const summary = await GST.calculateSummaryOfProducts(products);

            expect(summary.totalTax).to.equal(40);
            expect(summary.slabs.cgst.length).to.equal(1);
            expect(summary.slabs.sgst.length).to.equal(1);
            expect(summary.slabs.sgst[0].totalTaxAmount).to.equal(20);
            expect(summary.slabs.cgst[0].totalTaxAmount).to.equal(20);
            expect(summary.totalAmountWithTax).to.equal(100 + 130);
        });
    });

    describe("Integration testing", async () => {
        // Data Preparation
        const userTestData = {
            "password": "Test@123",
            "phone": faker.phone.number("##########") * 1,
            "name": faker.name.findName(),
        };

        // eslint-disable-next-line no-unused-vars
        let category, products, customer, testRequestData;

        before(async () => {
            userTestData.doc = await createUser(userTestData.name, userTestData.phone, userTestData.password, { type: privilegeEnum.admin });
            category = await createCategory(
                Math.random().toString(),
                userTestData.doc._id,
                []
            );
            customer = await createCustomer(
                faker.name.findName(),
                faker.phone.number("##########") * 1,
                userTestData.doc._id
            );
            products = [
                await createProduct(
                    Math.random().toString(),
                    Math.random().toString(),
                    Math.random().toString(),
                    100,
                    100,
                    100,
                    false,
                    0,
                    category._id,
                    [],
                    userTestData.doc._id,
                    10,
                    20,
                    false,
                    Math.random().toString(),
                )
            ];

            testRequestData = {
                "customerId": customer._id.toString(),
                "items": products.map(product => ({ "quantity": 1, _id: product._id.toString() })),
                "discountAmount": 0,
                "gst": true,
            };

            const { token } = await userAuthentication(userTestData.phone, userTestData.password);
            userTestData.token = token;
        });

        it("Create bill with GST", (done) => {
            chai.request(server)
                .post("/api/bill/")
                .set("Authorization", `Bearer ${userTestData.token}`)
                .send(testRequestData)
                .end((err, res) => {
                    if (err) done(err);
                    res.body.should.have.property("status").eql(1);
                    res.body.data.should.have.property("gstSummary");
                    res.body.data.gstSummary.should.have.property("totalTax").eql(30);

                    //TODO: Check for correct calculation of slabs
                    done();
                });
        });

        it("Create bill without GST", (done) => {
            const newRequestData = {
                ...testRequestData,
                "gst": false,
            };

            chai.request(server)
                .post("/api/bill/")
                .set("Authorization", `Bearer ${userTestData.token}`)
                .set("Content-Type", "application/json")
                .send(newRequestData)
                .end((err, res) => {
                    if (err) done(err);
                    res.body.should.have.property("status").eql(1);
                    res.body.data.should.have.property("gstSummary").eql(null);
                    done();
                });
        });

        after(async () => {
            await Bill.deleteMany({ belongsTo: userTestData.doc._id });
            await userTestData.doc.remove();
            await category.remove();
            await customer.remove();
            for (let i = 0; i < products.length; i++) {
                await products[i].remove();
            }
            return;
        });
    });
});
