module.exports = {
  async up(db, _client) {
    const customers = await db.collection("customers").find(
      {
        location: {
          $exists: true
        }
      }
    ).toArray();

    for (const customer of customers) {
      await db.collection("customers").updateOne(
        { _id: customer._id },
        {
          $set: {
            location: {
              type: "Point",
              coordinates: customer.location.coordinates.reverse()
            }
          }
        }
      );
    }
  },
  async down(db, _client) {
    const customers = await db.collection("customers").find(
      {
        location: {
          $exists: true
        }
      }
    ).toArray();

    for (const customer of customers) {
      await db.collection("customers").updateOne(
        { _id: customer._id },
        {
          $set: {
            location: {
              type: "Point",
              coordinates: customer.location.coordinates.reverse()
            }
          }
        }
      );
    }
  }
};
