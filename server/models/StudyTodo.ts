import mongoose from 'mongoose';

const studyTodoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    text: { type: String, required: true, default: '' },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

studyTodoSchema.index({ userId: 1, createdAt: -1 });

export const StudyTodo = mongoose.model('StudyTodo', studyTodoSchema);
