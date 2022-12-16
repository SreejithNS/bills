module.exports = {
  async up(db, _) {
    const result = await db.collection("bills").updateMany({
      "items.$[].cost": {
        $exists: false
      },
      "items.$[].converted": {
        $exists: false
      },
    }, {
      $set: {
        "items.$[].cost": 0,
        "items.$[].converted": 1
      }
    });
    console.log("Matched Bills:" + result.matchedCount);
    console.log("Modified Bills:" + result.modifiedCount);
  },

  async down(db, _) {
    const result = await db.collection("bills").updateMany({
      "items.$[].cost": {
        $exists: true
      },
      "items.$[].converted": {
        $exists: true
      },
    }, {
      $unset: {
        "items.$[].cost": 1,
        "items.$[].converted": 1
      }
    });
    console.log("Matched Bills:" + result.matchedCount);
    console.log("Modified Bills:" + result.modifiedCount);
  }
};
