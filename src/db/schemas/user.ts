import mongoose, { InferSchemaType, Schema, model, Model } from "mongoose";
import { MongoCollection } from "../enums";

const TermSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  courseIds: { type: [String], required: true },
});

const CourseMetadataSchema = new Schema({
  isOverwritten: { type: Boolean, required: true },
});

const PlanSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  termOrder: { type: [Schema.Types.ObjectId], required: true }, // foreign key to TermDataSchema, should be manually maintained
  courseMetadata: { type: Map, of: CourseMetadataSchema, required: true },
});

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    lastLogin: { type: Date, required: true },

    courseTaken: {
      type: Map,
      of: [String],
      required: true,
      default: {},
    },

    lang: {
      type: String,
      required: true,
      enum: ["EN", "FR"],
      default: "EN",
    },

    termData: {
      type: Map,
      of: TermSchema,
      required: true,
      default: {},
    },

    planData: {
      type: Map,
      of: PlanSchema,
      required: true,
      default: {},
    },

    planOrder: {
      type: [Schema.Types.ObjectId],
      required: true,
      default: [],
    },

    chatThreadIds: {
      type: [Schema.Types.ObjectId],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export type UserSchemaType = InferSchemaType<typeof UserSchema>;
export type PlanSchemaType = InferSchemaType<typeof PlanSchema>;
export type TermSchemaType = InferSchemaType<typeof TermSchema>;
export type CourseMetadataSchemaType = InferSchemaType<
  typeof CourseMetadataSchema
>;

// avoid multiple model registration in dev
const Users: Model<UserSchemaType> =
  mongoose.models.Users ||
  model<UserSchemaType>("Users", UserSchema, MongoCollection.USERS);

export default Users;
