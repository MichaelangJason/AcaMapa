import mongoose, { InferSchemaType, Schema, model, Model } from "mongoose";
import { MongoCollection } from "../enums";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    lastLogin: { type: Date, required: true },

    courseTaken: {
      type: Map,
      of: [String],
      required: false,
      default: {},
    },
    lang: {
      type: String,
      required: true,
      enum: ["EN", "FR"],
      default: "EN",
    },

    planIds: {
      type: [Schema.Types.ObjectId],
      required: false,
      default: [],
    },

    chatThreadIds: {
      type: [Schema.Types.ObjectId],
      required: false,
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export type User = InferSchemaType<typeof UserSchema>;

// avoid multiple model registration in dev
const Users: Model<User> =
  mongoose.models.Users ||
  model<User>("Users", UserSchema, MongoCollection.USERS);

export default Users;
