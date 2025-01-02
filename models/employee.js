const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    employeeId: {
      type: Number,
      unique: true,
      min: 1000,
      max: 9999,
    },
    hourlyWage: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: "employee",
    },
  },
  {
    timestamps: true,
  }
);

// Generate a random 4-digit employeeId if not provided
employeeSchema.pre("save", async function (next) {
  if (!this.employeeId) {
    let employeeId;
    let isUnique = false;
    while (!isUnique) {
      employeeId = Math.floor(1000 + Math.random() * 9000);
      const existingEmployee = await this.constructor.findOne({ employeeId });
      if (!existingEmployee) {
        isUnique = true;
      }
    }
    this.employeeId = employeeId;
  }
  next();
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
