import mongoose, { Schema } from "mongoose";
import type { UserRole } from "@/modules/users/domain/user.entity.js";

/**
 * Plain object interface for User persistence
 * Used with .lean() queries for better performance
 */
export interface UserDocument {
  _id: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    _id: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      required: false,
      sparse: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
  },
  {
    timestamps: true,
    _id: false, // We manage _id ourselves
  },
);

export const UserModel = mongoose.model<UserDocument>("User", userSchema);
