"use client";

import { useState } from "react";

export function ProjectImageCarousel({ images }: { images: { id: string; url: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;
  if (images.length === 1) {
    return <img src={images[0].url} alt="项目图片" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />;
  }

  const prev = () => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <img
        src={images[currentIndex].url}
        alt={`项目图片 ${currentIndex + 1}`}
        style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
      />
      {images.length > 1 && (
        <>
          <button onClick={prev} style={{
            position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%",
            width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center"
          }}>‹</button>
          <button onClick={next} style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%",
            width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center"
          }}>›</button>
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
            {images.map((_, i) => (
              <span key={i} onClick={() => setCurrentIndex(i)} style={{
                width: i === currentIndex ? 10 : 8, height: i === currentIndex ? 10 : 8,
                borderRadius: "50%", background: i === currentIndex ? "white" : "rgba(255,255,255,0.5)",
                cursor: "pointer", transition: "all 0.2s"
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AwardCarousel({ awards }: { awards: { id: string; date: string; name: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (awards.length === 0) return null;

  return (
    <div style={{ marginTop: "0.5rem", borderTop: "1px solid #eee", paddingTop: "0.5rem", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <p className="meta" style={{ fontSize: "0.85rem", margin: 0 }}>
            <span style={{ color: "#999" }}>{awards[currentIndex].date}</span>{" "}
            <span style={{ color: "#3b82f6", fontWeight: 600 }}>{awards[currentIndex].name}</span>
          </p>
        </div>
        {awards.length > 1 && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setCurrentIndex((i) => i === 0 ? awards.length - 1 : i - 1)} style={{
              background: "none", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontSize: "0.7rem"
            }}>‹</button>
            <button onClick={() => setCurrentIndex((i) => i === awards.length - 1 ? 0 : i + 1)} style={{
              background: "none", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", padding: "2px 6px", fontSize: "0.7rem"
            }}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
