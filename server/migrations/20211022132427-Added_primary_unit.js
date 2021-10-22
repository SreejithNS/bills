module.exports = {
  async up(db, _) {
    const result = await db.collection("products").updateMany({}, {
      $set: {
        primaryUnit: "Unit"
      }
    });
    console.log("Modified Products:" + result.modifiedCount);
  },

  async down(db, _) {
    const result = await db.collection("products").updateMany({ primaryUnit: { $exists: true } }, {
      $unset: {
        primaryUnit: ""
      }
    });
    console.log("Matched Products:" + result.matchedCount);
    console.log("Modified Products:" + result.modifiedCount);
  }
};
