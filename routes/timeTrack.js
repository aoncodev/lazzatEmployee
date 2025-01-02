const express = require("express");
const router = express.Router();
const timesheetController = require("../controllers/timeControllers");

// Get current status
router.get("/:employeeId/status", timesheetController.getCurrentStatus);

router.get("/today", timesheetController.getTodayTimesheets);

router.get("/stats", timesheetController.getEmployeeStats);

// Clock in or out
router.post("/:employeeId/clock", timesheetController.clockInOut);

// Start or end break
router.post("/:employeeId/break", timesheetController.toggleBreak);

module.exports = router;
