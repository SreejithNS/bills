var express = require("express");
const CustomerController = require("../controllers/CustomerController");

var router = express.Router();

router.get("/:id", CustomerController.get);
router.get("/", CustomerController.getAll);
router.post("/", CustomerController.create);
router.put("/:id", CustomerController.update);
router.delete("/:id", CustomerController.delete);
router.get("/suggestions/:name", CustomerController.getSuggestions);

module.exports = router;
