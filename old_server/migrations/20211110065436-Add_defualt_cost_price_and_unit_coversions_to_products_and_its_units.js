module.exports = {
  async up(db, _) {
    const result = await db.collection("products").updateMany({}, {
      $set: {
        cost: 0,
        stocked: false,
        stock: 0,
        "units.$[].cost": 0,
        "units.$[].conversion": 1
      }
    });
    console.log("Matched Products:" + result.matchedCount);
    console.log("Modified Products:" + result.modifiedCount);
  },

  async down(db, _) {
    const result = await db.collection("products").updateMany({}, {
      $unset: {
        cost: 1,
        stocked: 1,
        stock: 0,
        "units.$[].cost": 1,
        "units.$[].conversion": 1
      }
    });
    console.log("Matched Products:" + result.matchedCount);
    console.log("Modified Products:" + result.modifiedCount);
  }
};
