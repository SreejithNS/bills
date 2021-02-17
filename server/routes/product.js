var express = require("express");
const BillItemController = require("../controllers/BillItemController");

var router = express.Router();

router.get("/query/:category", BillItemController.query);
router.get("/suggestions/:category.:code", BillItemController.getSuggestions);
router.get(
	"/availability/:category.:code",
	BillItemController.productAvailability
);
router.get("/:id", BillItemController.get);
router.post("/:category", BillItemController.create);
router.put("/:id", BillItemController.update);
router.delete("/:id", BillItemController.delete);

module.exports = router;
