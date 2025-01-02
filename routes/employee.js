const express = require("express");
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

// Get all employees
router.get("/employee", getAllEmployees);

// Get a single employee
router.get("/employee/:id", getEmployeeById);

router.post("/employee", createEmployee);

// Update an employee
router.put("/employee/:id", updateEmployee);

// Delete an employee
router.delete("/employee/:id", deleteEmployee);

module.exports = router;
