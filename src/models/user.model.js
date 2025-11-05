import mongoose from "mongoose";
import * as argon2 from "argon2";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 5,
  },
  userName: {
    type: String,
    unique: true,
    required: true,
    minLength: 5,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 6,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await argon2.hash(this.password);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    return await argon2.verify(this.password, enteredPassword);
  } catch (err) {
    return false;
  }
};

const User = mongoose.model("User", UserSchema);

export default User;
