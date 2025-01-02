const Timesheet = require("../models/timesheet");
const Employee = require("../models/employee");

exports.getEmployeeStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total number of employees
    const totalEmployees = await Employee.countDocuments();

    // Get number of clocked in and on break employees
    const stats = await Timesheet.aggregate([
      {
        $match: {
          date: { $gte: today },
          clockOut: { $exists: false },
        },
      },
      {
        $addFields: {
          lastBreak: { $arrayElemAt: ["$breaks", -1] },
        },
      },
      {
        $group: {
          _id: null,
          clockedIn: { $sum: 1 },
          onBreak: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: [{ $size: "$breaks" }, 0] },
                    {
                      $or: [
                        { $eq: ["$lastBreak.endTime", null] },
                        { $not: ["$lastBreak.endTime"] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const clockedIn = stats.length > 0 ? stats[0].clockedIn : 0;
    const onBreak = stats.length > 0 ? stats[0].onBreak : 0;

    res.json({
      totalEmployees,
      clockedIn,
      onBreak,
    });
  } catch (error) {
    console.error("Error in getEmployeeStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get current status of an employee
exports.getCurrentStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timesheet = await Timesheet.findOne({
      employeeId,
      date: { $gte: today },
    }).sort({ date: -1 });

    if (!timesheet) {
      return res.json({
        status: "Not clocked in",
        breakStatus: "No active break",
      });
    }

    let status = timesheet.clockOut ? "Clocked out" : "Clocked in";
    let breakStatus = "No active break";

    if (timesheet.breaks.length > 0) {
      const lastBreak = timesheet.breaks[timesheet.breaks.length - 1];
      if (!lastBreak.endTime) {
        breakStatus = "On break";
      }
    }

    res.json({ status, breakStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clock in or out
exports.clockInOut = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let timesheet = await Timesheet.findOne({
      employeeId,
      date: { $gte: today },
    }).sort({ date: -1 });

    if (!timesheet || timesheet.clockOut) {
      // Clock in
      timesheet = new Timesheet({
        employeeId,
        clockIn: new Date(),
      });
      await timesheet.save();
      res.json({ message: "Clocked in successfully" });
    } else {
      // Automatically end the break if active
      if (timesheet.breaks.length > 0) {
        const lastBreak = timesheet.breaks[timesheet.breaks.length - 1];
        if (!lastBreak.endTime) {
          lastBreak.endTime = new Date(); // Automatically end break
          await timesheet.save();
        }
      }

      // Clock out
      timesheet.clockOut = new Date();
      await timesheet.save();
      res.json({
        message:
          "Clocked out successfully, break ended automatically if active",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start or end break
exports.toggleBreak = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timesheet = await Timesheet.findOne({
      employeeId,
      date: { $gte: today },
      clockOut: null,
    }).sort({ date: -1 });

    if (!timesheet) {
      return res
        .status(400)
        .json({ message: "No active timesheet found. Please clock in first." });
    }

    if (
      timesheet.breaks.length === 0 ||
      timesheet.breaks[timesheet.breaks.length - 1].endTime
    ) {
      // Start a new break
      timesheet.breaks.push({ startTime: new Date() });
      await timesheet.save();
      res.json({ message: "Break started" });
    } else {
      // End the current break
      timesheet.breaks[timesheet.breaks.length - 1].endTime = new Date();
      await timesheet.save();
      res.json({ message: "Break ended" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this to your timesheetController.js

// In your TimesheetController.js
exports.getTodayTimesheets = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Set time to the start of tomorrow

    const timesheets = await Timesheet.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: "$employeeId",
          date: { $first: "$date" },
          firstClockIn: { $min: "$clockIn" },
          lastClockOut: { $max: "$clockOut" },
          breaks: { $push: "$breaks" },
          totalHoursWorked: { $sum: "$totalHoursWorked" },
          dailyWage: { $sum: "$dailyWage" },
        },
      },
      {
        $addFields: {
          allBreaks: {
            $reduce: {
              input: "$breaks",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
      {
        $addFields: {
          totalBreakHours: {
            $reduce: {
              input: "$allBreaks",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      { $and: ["$$this.startTime", "$$this.endTime"] },
                      {
                        $divide: [
                          { $subtract: ["$$this.endTime", "$$this.startTime"] },
                          3600000, // milliseconds in an hour
                        ],
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "employeeId",
          as: "employeeDetails",
        },
      },
      {
        $addFields: {
          employeeName: { $arrayElemAt: ["$employeeDetails.name", 0] },
          employeeRole: { $arrayElemAt: ["$employeeDetails.role", 0] },
        },
      },
      {
        $project: {
          employeeId: "$_id",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          employeeName: 1,
          employeeRole: 1,
          firstClockIn: 1,
          lastClockOut: 1,
          totalHoursWorked: { $round: ["$totalHoursWorked", 2] },
          dailyWage: { $round: ["$dailyWage", 2] },
          totalBreakHours: { $round: ["$totalBreakHours", 2] },
          isCurrentlyWorking: { $eq: [{ $type: "$lastClockOut" }, "missing"] },
        },
      },
      {
        $sort: { firstClockIn: 1 },
      },
    ]);

    res.json(timesheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
