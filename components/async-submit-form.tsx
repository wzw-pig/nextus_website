"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  action: string;
  children: ReactNode;
  submitText: string;
  workingText: string;
  successRedirect?: string;
  className?: string;
  encType?: string;
};

type ApiResult = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

function parseRedirectMessage(urlText: string) {
  try {
    const url = new URL(urlText);
    const ok = url.searchParams.get("ok");
    const error = url.searchParams.get("error");
    if (ok || error) {
      return { ok: Boolean(ok), message: ok || error || "" };
    }
  } catch {
    return null;
  }
  return null;
}

export function AsyncSubmitForm({
  action,
  children,
  submitText,
  workingText,
  successRedirect,
  className,
  encType
}: Props) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setBusy(true);
    setError("");
    setOk("");
    setProgress(15);
    try {
      const response = await fetch(action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "x-requested-with": "XMLHttpRequest"
        }
      });
      setProgress(70);

      let data: ApiResult | null = null;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          data = (await response.json()) as ApiResult;
        } catch {
          data = null;
        }
      } else if (response.redirected && response.url) {
        const redirected = parseRedirectMessage(response.url);
        if (redirected) data = { ...redirected };
      }

      if (!response.ok || !data?.ok) {
        if (data?.message) {
          setError(data.message);
        } else if (response.status === 404) {
          setError("请求地址不存在（404），请刷新后重试。若持续出现，请联系管理员检查接口路径。");
        } else if (response.status >= 500) {
          setError(`服务器处理失败（${response.status}）`);
        } else {
          setError(`请求失败（${response.status}）`);
        }
        setProgress(0);
        setBusy(false);
        return;
      }

      setProgress(100);
      setOk(data.message || "操作成功");
      const target = data.redirectTo || successRedirect;
      if (target && target.startsWith("/") && !target.startsWith("/api/")) router.push(target);
      router.refresh();
      form.reset();
    } catch (error) {
      if (error instanceof Error && error.message) {
        setError(error.message);
      } else {
        setError("请求失败，请稍后重试");
      }
      setProgress(0);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={className} onSubmit={onSubmit} encType={encType}>
      {children}
      <progress value={progress} max={100} style={{ width: "100%" }} />
      {error ? <p className="danger">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? workingText : submitText}
      </button>
    </form>
  );
}
