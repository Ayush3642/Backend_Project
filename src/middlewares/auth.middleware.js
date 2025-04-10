import { User } from "../models/user.model.js";
import { ApiErrors } from "../utils/apiErrors.js";
import jwt from "jsonwebtoken";

export const verifyJWT = async (req, res, next) => {
  try {
    const token = await req.cookies?.accessToken; //or req.header("Authorization")?.replace("bearer ", "")

    if (!token) {
      throw new ApiErrors(401, "Unauthorized access");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiErrors(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiErrors(401, error?.message || "Invalid access token");
  }
};
