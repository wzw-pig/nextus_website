"use client";

import { useEffect, useRef } from "react";

export function CircuitSpotlight() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const overlay = overlayRef.current;
    if (!section || !overlay) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      overlay.style.setProperty("--mx", `${x}px`);
      overlay.style.setProperty("--my", `${y}px`);
      overlay.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      overlay.style.opacity = "0";
    };

    section.addEventListener("mousemove", handleMouseMove);
    section.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section className="hero hero-spotlight" id="hero" ref={sectionRef}>
      {/* Background layers - lowest z-index */}
      <div className="hero-bg-layers">
        <div className="circuit-background"></div>
        <div className="circuit-overlay" ref={overlayRef}></div>
        <div className="hero-particles"></div>
      </div>

      {/* Content layer - higher z-index but pointer-events none on container */}
      <div className="hero-content-layer">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text" style={{ marginLeft: 40 }}>
              <h1 className="hero-title">
                <span className="gradient-text">NextUs</span>
                <br />学生竞赛团队
              </h1>
              <p className="hero-subtitle">
                汇聚创新思维，点燃竞技激情<br />
                在这里，每一个想法都有可能改变世界
              </p>
              <div className="hero-buttons">
                <a href="#about" className="btn btn-primary">了解我们</a>
                <a href="#recruitment" className="btn btn-secondary">加入团队</a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="floating-card main-card">
                <img src="/logo.png" alt="NextUs Logo" className="hero-logo" />
                <div className="card-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fade-mask"></div>
    </section>
  );
}
