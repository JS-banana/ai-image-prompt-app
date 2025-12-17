import { handleGenerateRequest } from "./handler";

export async function POST(request: Request) {
  return handleGenerateRequest(request);
}
