import { asyncHandler } from "../utils/asyncHandler.js";

// const registerUser = asyncHandler(async (req, res) => {
//   res.status(200).json({
//     message: "OK",
//   });
// });

const registerUser = async (req, res) => {
  try {
    res.status(200).json({
      message: "Hi Ayush",
    });
  } catch (error) {
    console.log("ERR   ", error);
  }
};

export { registerUser };
