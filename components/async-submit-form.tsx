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
      const data = (await response.json()) as ApiResult;
      if (!response.ok || !data.ok) {
        setError(data.message || "未知错误");
        setProgress(0);
        setBusy(false);
        return;
      }

      setProgress(100);
      setOk(data.message || "操作成功");
      const target = data.redirectTo || successRedirect;
      if (target) router.push(target);
      router.refresh();
      form.reset();
    } catch {
      setError("未知错误");
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
