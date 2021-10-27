module.exports = {
  async up(db, _) {
    const result = await db.collection("users").updateMany({
      $or: [
        { type: 0 }, { type: 1 }
      ]
    }, {
      $set: {
        organisation: {
          name: "Organisation",
          printTitle: "Billz",
          tagline: "Cloud Bill Management"
        }
      }
    });
    console.log("Matched Users:" + result.matchedCount);
    console.log("Modified Users:" + result.modifiedCount);
  },

  async down(db, _) {
    const result = await db.collection("users").updateMany({ organisation: { $exists: true } }, {
      $unset: {
        organisation: ""
      }
    });
    console.log("Matched Users:" + result.matchedCount);
    console.log("Modified Users:" + result.modifiedCount);
  }
};
