import type { JSX } from "react";
import { useEffect, useState, useContext, useMemo } from "react";
import { TinkerableContext } from "@immediately-run/sdk/TinkerableContext";
import fs from "fs";

interface ImageProps {
  src: string;
  alt?: string;
  className?: string;
}

function resolvePath(basePath: string, relativePath: string): string {
  if (relativePath.startsWith("/")) return relativePath;
  const parts = basePath.split("/");
  parts.pop(); // Remove filename
  
  const relParts = relativePath.split("/");
  for (const part of relParts) {
    if (part === "." || part === "") continue;
    if (part === "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join("/");
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export const Image = ({ src, alt = "", className = "" }: ImageProps): JSX.Element => {
  const { navigationState } = useContext(TinkerableContext) as any;
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const absolutePath = useMemo(() => {
    const sandboxPath = navigationState?.sandboxPath || "/app/pages/entries/index.mdx";
    return resolvePath(sandboxPath, src);
  }, [navigationState?.sandboxPath, src]);

  useEffect(() => {
    let active = true;
    let url: string | null = null;

    const loadImage = async () => {
      try {
        // Read file bytes from the sandboxed ZenFS mount
        const data = await fs.promises.readFile(absolutePath);
        if (!active) return;

        const blob = new Blob([data], { type: getMimeType(src) });
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setError(false);
      } catch (err) {
        console.error(`Failed to load image from path: ${absolutePath}`, err);
        if (active) {
          setError(true);
        }
      }
    };

    loadImage();

    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [absolutePath, src]);

  if (error) {
    return <div className="image-error-fallback">Failed to load image: {src}</div>;
  }

  if (!blobUrl) {
    return <div className="image-loading-placeholder">Loading image...</div>;
  }

  return <img src={blobUrl} alt={alt} className={className} />;
};

export default Image;
