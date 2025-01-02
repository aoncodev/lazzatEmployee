const mongoose = require("mongoose");
const Employee = require("./employee");

const timesheetSchema = new mongoose.Schema({
  employeeId: {
    type: Number,
    ref: "Employee",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  clockIn: {
    type: Date,
    required: true,
  },
  clockOut: {
    type: Date,
  },
  breaks: [
    {
      startTime: Date,
      endTime: Date,
    },
  ],
  totalHoursWorked: {
    type: Number,
  },
  dailyWage: {
    type: Number,
  },
});

timesheetSchema.pre("save", async function (next) {
  if (this.clockOut) {
    // Calculate total work duration in milliseconds
    let totalMs = this.clockOut.getTime() - this.clockIn.getTime();

    // Subtract break durations
    let breakMs = 0;
    this.breaks.forEach((breakPeriod) => {
      if (breakPeriod.endTime) {
        breakMs +=
          breakPeriod.endTime.getTime() - breakPeriod.startTime.getTime();
      }
    });

    // Calculate final hours worked
    this.totalHoursWorked = (totalMs - breakMs) / (1000 * 60 * 60);

    // Calculate daily wage
    const employee = await Employee.findOne({ employeeId: this.employeeId });
    if (employee) {
      this.dailyWage = this.totalHoursWorked * employee.hourlyWage;
    }
  }
  next();
});

const Timesheet = mongoose.model("Timesheet", timesheetSchema);

module.exports = Timesheet;
