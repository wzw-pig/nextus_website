import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { recordWebsiteVisit } from "@/lib/visit";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextUs 永远的我们",
  description: "NextUs 学生竞赛团队官网与内网管理平台"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = headers();
  await recordWebsiteVisit({
    host: headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
    method: headerStore.get("x-http-method-override"),
    purpose: headerStore.get("purpose") ?? headerStore.get("sec-purpose"),
    pathname: headerStore.get("next-url")
  });

  return (
    <html lang="zh-CN">
      <body>
        <div className="app-root">
          <SiteHeader />
          <main>
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
