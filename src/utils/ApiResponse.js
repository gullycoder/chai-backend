const ApiResponse = {
  success: (res, data, message) => {
    res.status(200).json({
      success: true,
      data,
      message,
    });
  },
  error: (res, status, message) => {
    res.status(status).json({
      success: false,
      message,
    });
  },
};

export { ApiResponse };
