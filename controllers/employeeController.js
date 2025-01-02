const Employee = require("../models/employee");

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single employee
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employeeId: parseInt(req.params.id),
    });
    if (employee == null) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new employee
exports.createEmployee = async (req, res) => {
  const employee = new Employee({
    name: req.body.name,
    hourlyWage: req.body.hourlyWage,
    active: req.body.active,
    role: req.body.role,
  });

  try {
    const newEmployee = await employee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update an employee
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employeeId: parseInt(req.params.id),
    });
    if (employee == null) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (req.body.name != null) {
      employee.name = req.body.name;
    }
    if (req.body.hourlyWage != null) {
      employee.hourlyWage = req.body.hourlyWage;
    }
    if (req.body.active != null) {
      employee.active = req.body.active;
    }
    if (req.body.role != null) {
      employee.role = req.body.role;
    }

    const updatedEmployee = await employee.save();
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete an employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employeeId: parseInt(req.params.id),
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await Employee.deleteOne({ employeeId: parseInt(req.params.id) }); // Use the deleteOne method with a query
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
