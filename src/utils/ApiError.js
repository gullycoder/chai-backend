// create a function that will handel the error and return the error message and status code

function ApiError(status, message) {
  const error = new Error(message);
  error.status = status;

  return error;
}
// const ApiError = (status, message) => {
//   const error = new Error(message);
//   error.status = status;

//   return error;
// };

export { ApiError };
