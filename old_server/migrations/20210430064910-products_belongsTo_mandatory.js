module.exports = {
  async up(db, client) {
    var affectedDocuments = 0;
    const categories = db.collection("productcategories").find({});
    while (await categories.hasNext()) {
      const category = await categories.next();
      const products = db.collection("products").find({ category: category._id });
      while (await products.hasNext()) {
        const product = await products.next();
        if (!product.belongsTo) {
          await db.collection("products").updateOne({ _id: product._id }, {
            $set: {
              belongsTo: category.belongsTo
            }
          });
          affectedDocuments++;
        }
      }
    }
    console.log("Modified Products:" + affectedDocuments);
  },
  async down(db, client) {
    var affectedDocuments = 0;
    const categories = db.collection("productcategories").find({});
    while (await categories.hasNext()) {
      const category = await categories.next();
      const products = db.collection("products").find({ category: category._id });
      while (await products.hasNext()) {
        const product = await products.next();
        if (!product.belongsTo) {
          await db.collection("products").updateOne({ _id: product._id }, {
            $unset: {
              belongsTo: ""
            }
          });
          affectedDocuments++;
        }
      }
    }
    console.log("Modified Products:" + affectedDocuments);
  }
};
