import {asyncHandler} from '../utils/asynchandler.js';

const registerUser = asyncHandler(async (req, res) => {
    // code to register a user
    res.status(201).json({ message: "User registered successfully" });
});

export { registerUser };