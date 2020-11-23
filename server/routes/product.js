var express = require("express");
const BillItemController = require("../controllers/BillItemController");

var router = express.Router();

router.get("/query", BillItemController.query);
router.get("/suggestions/:code", BillItemController.getSuggestions);
router.get("/availability/:code", BillItemController.productAvailability);
router.get("/:id", BillItemController.get);
router.post("/", BillItemController.create);
router.put("/:id", BillItemController.update);
router.delete("/:id", BillItemController.delete);

module.exports = router;
