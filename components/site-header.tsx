"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" className="nav-brand" style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
          <img src="/logo.png" alt="NextUs Logo" className="logo" style={{ height: 40, width: "auto" }} />
          <span className="brand-text" style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>NextUs</span>
        </Link>

        <div className={`nav-menu${menuOpen ? " active" : ""}`} style={{
          display: "flex",
          gap: "2rem",
          alignItems: "center"
        }}>
          <a href="/#about" className="nav-link" onClick={() => setMenuOpen(false)}>团队简介</a>
          <a href="/#projects" className="nav-link" onClick={() => setMenuOpen(false)}>历史项目</a>
          <a href="/#tech" className="nav-link" onClick={() => setMenuOpen(false)}>技术栈</a>
          <a href="/#organization" className="nav-link" onClick={() => setMenuOpen(false)}>组织架构</a>
          <a href="/#recruitment" className="nav-link" onClick={() => setMenuOpen(false)}>加入我们</a>
          <a href="/#contact" className="nav-link" onClick={() => setMenuOpen(false)}>联系我们</a>
          <div className="nav-system-links">
            <Link href="/intranet/login" className="btn btn-neutral btn-small" onClick={() => setMenuOpen(false)}>
              内网系统
            </Link>
            <Link href="/admin/login" className="btn btn-neutral btn-small" onClick={() => setMenuOpen(false)}>
              管理系统
            </Link>
          </div>
        </div>

        <div className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
}
