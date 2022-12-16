var express = require("express");
const { createCategoryRequest, exportProducts, getCategoryStats, deleteProductCategory, updateProductCategory, getProductCategoriesList, productAvailability, getProductSuggestions, createProductRequest, deleteProduct, updateProduct, queryProduct, importProducts, getProduct } = require("../controllers/ProductController");

var router = express.Router();

router.post("/category", createCategoryRequest);
router.get("/category", getProductCategoriesList);
router.put("/:categoryId", updateProductCategory);
router.delete("/:categoryId.:productId", deleteProduct);
router.delete("/:categoryId", deleteProductCategory);
router.get("/:categoryId/query", queryProduct);
router.get("/:categoryId/export", exportProducts);
router.get("/:categoryId/stats", getCategoryStats);

router.post("/:categoryId", createProductRequest);
router.post("/:categoryId/import", importProducts);
router.get("/:categoryId.:productId", getProduct);
router.put("/:categoryId/:productId", updateProduct);

router.get("/:categoryId/suggestion/:code", getProductSuggestions);
router.get("/:categoryId/availability/:code", productAvailability);

module.exports = router;
