"use client";
import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const urlRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [ytDlpAvailable, setYtDlpAvailable] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);

  // Check yt-dlp availability on mount
  useEffect(() => {
    fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("yt-dlp not available");
        return res;
      })
      .then(() => setYtDlpAvailable(true))
      .catch(() => setYtDlpAvailable(false));
  }, []);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloading(true);
    setProgress(0);
    toast("Download started", { description: "Your video is being downloaded..." });
    const url = urlRef.current?.value;
    if (!url) {
      toast("Error", { description: "Please enter a video URL." });
      setDownloading(false);
      setProgress(null);
      return;
    }
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Download failed");
      }
      // Get filename from Content-Disposition
      const disposition = res.headers.get("Content-Disposition");
      let filename = "video.mp4";
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match) filename = match[1];
      }
      // Progress bar logic
      const contentLength = res.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength) : 0;
      const reader = res.body?.getReader();
      let received = 0;
      const chunks = [];
      if (reader && total) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            setProgress(Math.round((received / total) * 100));
          }
        }
        setProgress(100);
        const blob = new Blob(chunks, { type: "video/mp4" });
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(a.href);
      } else {
        // fallback if no reader or no content length
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(a.href);
      }
      toast("Download complete", { description: `Saved as ${filename}` });
    } catch (err: any) {
      toast("Error", { description: err.message || "Download failed" });
    } finally {
      setDownloading(false);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden">
      {/* Modern SaaS animated grid + radial background */}
      <div className="absolute inset-0 h-full w-full bg-black -z-10">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] mx-auto rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]" />
      </div>
      <Toaster position="top-center" richColors />
      {/* Animated SaaS-style branding area */}
      <motion.div
        className="mb-8 flex flex-col items-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring" }}
      >
        <div className="rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 p-1 mb-2 shadow-lg">
          <div className="bg-white rounded-full p-3 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#6366f1"/>
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">StreamSage</h1>
        <p className="text-lg text-gray-200 mt-2 font-medium text-center max-w-md">The easiest way to download videos from anywhere. Fast, private, and free.</p>
      </motion.div>
      <motion.div
        className="w-full max-w-md"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <Card className="relative overflow-hidden shadow-2xl border-none bg-white/95 hover:shadow-3xl transition-shadow duration-300">
          {/* Aceternity Glare Effect */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)",
            }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          />
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Download a Video</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <form onSubmit={handleDownload} className="flex flex-col gap-4 w-full">
              <Label htmlFor="url" className="text-base">Video URL</Label>
              <Input
                ref={urlRef}
                id="url"
                type="url"
                placeholder="Paste a YouTube or other video URL"
                required
                disabled={!ytDlpAvailable || downloading}
                className="text-base"
              />
              <Button
                type="submit"
                disabled={!ytDlpAvailable || downloading}
                className="mt-2 text-base font-semibold bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:scale-[1.03] transition-transform"
                size="lg"
              >
                {downloading ? "Downloading..." : "Download Video"}
              </Button>
            </form>
            {downloading && progress !== null && (
              <div className="w-full flex flex-col gap-2 items-center">
                <Progress value={progress} className="w-full h-2" />
                <span className="text-xs text-gray-700">{progress}%</span>
              </div>
            )}
            {!ytDlpAvailable && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-center">
                yt-dlp is not available on the server. Please install yt-dlp and ensure it is in the PATH.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      <footer className="mt-10 text-xs text-gray-400 text-center">
        &copy; {new Date().getFullYear()} StreamSage by Antlers Labs. All rights reserved.
      </footer>
    </main>
  );
}
