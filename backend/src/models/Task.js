import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    status: {
      type: String,
      enum: ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"],
      default: "BACKLOG",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    labels: [{ type: String, trim: true, maxlength: 30 }],
    dueDate: Date,
    position: { type: Number, default: 0 },
    attachments: [{ name: String, url: String }],
    reviewFeedback: { type: String, default: "" },
    reviewSubmittedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: Date,
  },
  { timestamps: true },
);

taskSchema.index({ title: "text", description: "text" });
export default mongoose.model("Task", taskSchema);
