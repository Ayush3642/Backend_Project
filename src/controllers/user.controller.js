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
  // Algo for registering user :
  // get user details from frontend
  // validation - not empty
  // check if user already exist : username , email
  // check for images : avatar
  // upload them to cloadinary ,avatar
  // create user object - create entry in db
  // remove password and refresh token feilds
  // check for user creation
  // return res
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

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    // console.log(user);
    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiErrors(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const loginUser = async (req, res) => {
  // Algo for Loging In user :
  // req.body -> data
  // check username or email
  // find user
  // password check
  // access and refresh token
  // send cookie
  try {
    // req.body -> data
    const { username, email, password } = req.body;

    // check username or email
    if (!(email || username)) {
      throw new ApiErrors(400, "username/email is Required !!");
    }

    // find user
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (!user) {
      throw new ApiErrors(400, "User not found !!");
    }

    // password check
    if (!password) {
      throw new ApiErrors(400, "Password is Required !!");
    }
    const checkPassword = await user.isPasswordCorrect(password);
    if (!checkPassword) {
      throw new ApiErrors(400, "Incorrect Password !!");
    }

    // access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    // send cookie
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, loggedInUser, "user Logged in successfully"));
  } catch (error) {
    console.log("ERR   ", error);
  }
};

const logOutUser = async (req, res) => {
  try {
    const user = req.user;
    await User.findByIdAndUpdate(user._id, {
      $set: {
        refreshToken: undefined,
      },
    });

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User Logged out successfully!!"));
  } catch (error) {
    console.log("ERR   ", error);
  }
};

export { registerUser, loginUser, logOutUser };
