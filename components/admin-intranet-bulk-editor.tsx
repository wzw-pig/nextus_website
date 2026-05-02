"use client";

import { Department } from "@prisma/client";
import { useState } from "react";

type UserRow = {
  id: string;
  username: string;
  name: string;
  department: Department;
  employeeId: string;
  contact: string;
  canApproveFinance: boolean;
  isForumAdmin: boolean;
  isActive: boolean;
  password: string;
};

type Props = {
  users: Array<Omit<UserRow, "password">>;
  departmentLabels: Record<Department, string>;
};

export function AdminIntranetBulkEditor({ users, departmentLabels }: Props) {
  const [rows, setRows] = useState<UserRow[]>(users.map((item) => ({ ...item, password: "" })));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function updateRow<K extends keyof UserRow>(id: string, key: K, value: UserRow[K]) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  async function submitAll() {
    setBusy(true);
    setMessage("正在保存...");
    try {
      const response = await fetch("/api/admin/intranet-users/batch-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: rows.map((row) => ({
            ...row,
            password: row.password.trim()
          }))
        })
      });
      const data = (await response.json()) as { ok: boolean; message: string };
      setMessage(data.message);
      if (data.ok) {
        setRows((prev) => prev.map((row) => ({ ...row, password: "" })));
      }
    } catch {
      setMessage("保存失败：未知错误");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>账号</th>
            <th>姓名/部门</th>
            <th>工号/联系方式</th>
            <th>权限与状态</th>
            <th>重置密码（可选）</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>
                <input value={user.name} onChange={(e) => updateRow(user.id, "name", e.target.value)} />
                <select
                  value={user.department}
                  onChange={(e) => updateRow(user.id, "department", e.target.value as Department)}
                  style={{ marginTop: "0.4rem" }}
                >
                  {Object.entries(departmentLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input value={user.employeeId} onChange={(e) => updateRow(user.id, "employeeId", e.target.value)} />
                <input
                  value={user.contact}
                  onChange={(e) => updateRow(user.id, "contact", e.target.value)}
                  style={{ marginTop: "0.4rem" }}
                />
              </td>
              <td>
                <label>
                  <input
                    type="checkbox"
                    checked={user.canApproveFinance}
                    onChange={(e) => updateRow(user.id, "canApproveFinance", e.target.checked)}
                    style={{ width: "auto" }}
                  />
                  审批权限
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={user.isForumAdmin}
                    onChange={(e) => updateRow(user.id, "isForumAdmin", e.target.checked)}
                    style={{ width: "auto" }}
                  />
                  内网管理员
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={user.isActive}
                    onChange={(e) => updateRow(user.id, "isActive", e.target.checked)}
                    style={{ width: "auto" }}
                  />
                  账号启用
                </label>
              </td>
              <td>
                <input
                  type="password"
                  value={user.password}
                  onChange={(e) => updateRow(user.id, "password", e.target.value)}
                  placeholder="留空则不重置"
                />
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="meta">
                暂无内网账号
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="actions" style={{ marginTop: "0.8rem" }}>
        <button className="btn btn-primary" type="button" disabled={busy || rows.length === 0} onClick={submitAll}>
          {busy ? "正在保存..." : "保存并提交"}
        </button>
      </div>
      {message ? <p className="meta">{message}</p> : null}
    </div>
  );
}
