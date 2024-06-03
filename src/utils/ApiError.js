// create a function that will handel the error and return the error message and status code

const ApiError = (status, message) => {
  const error = new Error(message) || "Something went wrong";
  error.status = status;

  return error;
};

export { ApiError };
