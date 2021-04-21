var express = require("express");
const { create, deleteCustomer, getAll, get, getSuggestions, update } = require("../controllers/CustomerController");

var router = express.Router();

router.get("/query", getAll);
router.get("/suggestions/:name", getSuggestions);

router.post("/", create);
router.get("/:customerId", get);
router.put("/:customerId", update);
router.delete("/:customerId", deleteCustomer);

module.exports = router;
