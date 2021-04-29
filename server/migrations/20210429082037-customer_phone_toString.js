module.exports = {
  async up(db, client) {
    const customers = db.collection("customers").find({});
    while (await customers.hasNext()) {
      const customer = await customers.next();
      await db.collection("customers").updateOne({ _id: customer._id }, {
        $set: {
          phone: customer.phone.toString()
        }
      })
    }
  },

  async down(db, client) {
    const customers = db.collection("customers").find({});
    while (await customers.hasNext()) {
      const customer = await customers.next();
      await db.collection("customers").updateOne({ _id: customer._id }, {
        $set: {
          phone: parseInt(customer.phone)
        }
      })
    }
  }
};
