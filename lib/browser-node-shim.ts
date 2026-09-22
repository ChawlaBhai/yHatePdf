const unavailable = () => {
  throw new Error("This Node-only API is unavailable in the browser.");
};

export const promises = {};
export const createRequire = () => unavailable;
export const readFile = unavailable;
export default {};
