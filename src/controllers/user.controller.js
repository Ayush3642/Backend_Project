import { ApiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// const registerUser = asyncHandler(async (req, res) => {
//   res.status(200).json({
//     message: "OK",
//   });
// });\\

const registerUser = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    // console.log("email  :", email);

    //validation - not empty
    if (fullName === "") {
      throw new ApiErrors(400, "fullname is required");
    }

    //check if user already exist : username , email
    let doesExist = await User.findOne({
      $or: [{ username }, { email }],
    });
    // console.log(doesExist);

    //check for images : avatar
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
      throw new ApiErrors(400, "avatar file is required");
    }

    // upload them to cloadinary ,avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
      throw new ApiErrors(400, "AVATAR file is required");
    }

    // create user object - create entry in db
    const user = await User.create({
      fullName,
      email,
      avatar: avatar.url,
      coverImage: coverImage.url || "",
      username,
      password,
    });

    // check for user creation
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiErrors(500, "Something went wrong while registering user");
    }

    //return res
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "Uer registered Successfully!!"));
  } catch (error) {
    console.log("ERR   ", error);
  }
};

export { registerUser };

// Algo for registering user :
// get user details from frontend
//validation - not empty
//check if user already exist : username , email
// check for images : avatar
//upload them to cloadinary ,avatar
// create user object - create entry in db
//remove password and refresh token feilds
// check for user creation
//return res
