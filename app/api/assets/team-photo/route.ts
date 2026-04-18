import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

export async function GET() {
  const imagePath = join(process.cwd(), "things", "team.jpg");
  const data = await readFile(imagePath);
  return new Response(data, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
