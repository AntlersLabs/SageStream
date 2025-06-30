import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { createReadStream, promises as fs } from "fs";
import path from "path";
import os from "os";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Invalid URL" }), { status: 400 });
    }

    // Get video title using yt-dlp
    const title = await new Promise<string>((resolve, reject) => {
      let title = "video";
      const ytDlpTitle = spawn("yt-dlp", ["--get-title", url]);
      let output = "";
      ytDlpTitle.stdout.on("data", (data) => {
        output += data.toString();
      });
      ytDlpTitle.on("close", (code) => {
        if (code === 0) {
          title = output.trim() || "video";
          resolve(title);
        } else {
          resolve("video");
        }
      });
      ytDlpTitle.on("error", () => resolve("video"));
    });

    // Always use mp4 output
    const tmpDir = os.tmpdir();
    const outPath = path.join(tmpDir, `yt-dlp-download-${Date.now()}.mp4`);

    // Spawn yt-dlp process for best available video
    const ytDlp = spawn("yt-dlp", ["-f", "best", "-o", outPath, url]);

    let stderr = "";
    ytDlp.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const exitCode: number = await new Promise((resolve) => {
      ytDlp.on("close", resolve);
    });

    if (exitCode !== 0) {
      return new Response(JSON.stringify({ error: stderr || "yt-dlp failed" }), { status: 500 });
    }

    // Get file size
    const stat = await fs.stat(outPath);
    const fileSize = stat.size;
    const fileStream = createReadStream(outPath);

    // Sanitize title for filename
    const safeTitle = title.replace(/[^a-zA-Z0-9-_\.]/g, "_");
    const filename = `${safeTitle}.mp4`;

    // Create a readable stream response
    const response = new Response(fileStream as any, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Content-Length": fileSize.toString(),
      },
    });

    // Clean up file after stream ends
    fileStream.on("close", async () => {
      await fs.unlink(outPath);
    });

    return response;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), { status: 500 });
  }
} 