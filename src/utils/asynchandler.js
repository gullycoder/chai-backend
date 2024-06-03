const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export { asyncHandler };

// const asyncHandler =  () => {}

// const asyncHandler = (fn) => () => {}

// const asyncHandler = (fn) => (req, res, next) => {
//     (req, res, next) => {
//         Promise.resolve(fn(req, res, next)).catch((error) => next(error));
//     }
// };
