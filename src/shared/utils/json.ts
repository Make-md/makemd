
export const safelyParseJSON = (json: string) => {
  // This function cannot be optimised, it's best to
  // keep it small!
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    //
    // Oh well, but whatever...
  }

  return parsed; // Could be undefined!
};
