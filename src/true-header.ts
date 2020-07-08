import { IncomingMessage } from "http";

export default (req: IncomingMessage, headerName: string) => {
  const headerValues = req.headers[headerName];

  if (!headerValues) return false;

  if (Array.isArray(headerValues)) {
    return headerValues.some(h => h.toLowerCase() === "true");
  }
  return headerValues.toLowerCase() === "true";
};
