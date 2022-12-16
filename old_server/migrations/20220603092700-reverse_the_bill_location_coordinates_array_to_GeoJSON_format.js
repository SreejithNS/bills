module.exports = {
  async up(db, _client) {
    const bills = await db.collection("bills").find(
      {
        location: {
          $exists: true
        }
      }
    ).toArray();

    for (const bill of bills) {
      await db.collection("bills").updateOne(
        { _id: bill._id },
        {
          $set: {
            location: {
              type: "Point",
              coordinates: bill.location.coordinates.reverse()
            }
          }
        }
      );
    }
  },
  async down(db, _client) {
    const bills = await db.collection("bills").find(
      {
        location: {
          $exists: true
        }
      }
    ).toArray();

    for (const bill of bills) {
      await db.collection("bills").updateOne(
        { _id: bill._id },
        {
          $set: {
            location: {
              type: "Point",
              coordinates: bill.location.coordinates.reverse()
            }
          }
        }
      );
    }
  }
};
