import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //URL of the video file from cloudinary or any other video hosting service
      required: true,
    },
    thumbNail: {
      type: String, //URL of the thumbnail image from cloudinary or any other image hosting service
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number, // get the duration of the video in seconds from the cloudinary API
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

//plugin to add pagination to the model
videoSchema.plugin(mongooseAggregatePaginate);

export default mongoose.model("Video", videoSchema);
