var express = require("express");
const { createCategoryRequest, deleteProductCategory, getProductCategoriesList, productAvailability, getProductSuggestions, createProductRequest, deleteProduct, updateProduct, queryProduct, importProducts, getProduct } = require("../controllers/ProductController");

var router = express.Router();

router.post("/category", createCategoryRequest);
router.get("/category", getProductCategoriesList);
router.get("/:categoryId/query", queryProduct);
router.delete("/:categoryId", deleteProductCategory);

router.post("/:categoryId", createProductRequest);
router.post("/:categoryId/import", importProducts);
router.get("/:categoryId.:productId", getProduct);
router.put("/:categoryId.:productId", updateProduct);
router.delete("/:categoryId.:productId", deleteProduct);

router.get("/:categoryId/suggestion/:code", getProductSuggestions);
router.get("/:categoryId/availability/:code", productAvailability);

module.exports = router;
