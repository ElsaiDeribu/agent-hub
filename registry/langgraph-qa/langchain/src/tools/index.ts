import { echo } from "./echo.js";
import { calculator } from "./calculator.js";
import { getCurrentTime } from "./time.js";

export { echo, calculator, getCurrentTime };

export const tools = [getCurrentTime, calculator, echo];
