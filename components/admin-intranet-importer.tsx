"use client";

import { Department } from "@prisma/client";
import { useMemo, useState } from "react";

type Row = {
  username: string;
  name: string;
  department: Department;
  employeeId: string;
  contact: string;
  canApproveFinance: boolean;
  password: string;
};

type Props = {
  departmentLabels: Record<Department, string>;
};

const departmentValues = Object.values(Department);

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeBoolean(v: string) {
  const raw = v.trim().toLowerCase();
  return raw === "是" || raw === "true" || raw === "1" || raw === "yes" || raw === "y";
}

function parseCsv(content: string, labelToDepartment: Record<string, Department>): { rows: Row[]; error?: string } {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (lines.length < 2) return { rows: [], error: "CSV 至少需要表头和一行数据" };

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const expected = ["用户名", "姓名", "部门", "工号", "手机号", "审批权限", "密码"];
  if (headers.length !== expected.length || expected.some((h, i) => headers[i] !== h)) {
    return { rows: [], error: "CSV 表头必须为：用户名,姓名,部门,工号,手机号,审批权限,密码" };
  }

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    if (cells.length !== 7) {
      return { rows: [], error: `第 ${i + 1} 行列数不正确` };
    }
    const departmentRaw = cells[2].trim();
    const department =
      (departmentValues.find((item) => item === departmentRaw) as Department | undefined) ||
      labelToDepartment[departmentRaw];
    if (!department) {
      return { rows: [], error: `第 ${i + 1} 行部门无效` };
    }
    rows.push({
      username: cells[0].trim(),
      name: cells[1].trim(),
      department,
      employeeId: cells[3].trim(),
      contact: cells[4].trim(),
      canApproveFinance: normalizeBoolean(cells[5]),
      password: cells[6]
    });
  }
  return { rows };
}

export function AdminIntranetImporter({ departmentLabels }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const labelToDepartment = useMemo(() => {
    const map: Record<string, Department> = {};
    for (const [key, label] of Object.entries(departmentLabels)) {
      map[label] = key as Department;
    }
    return map;
  }, [departmentLabels]);

  const canSubmit = useMemo(() => rows.length > 0 && !busy, [rows.length, busy]);

  async function onSelectFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setProgress(15);
    setMessage("");
    const text = await file.text();
    setProgress(55);
    const parsed = parseCsv(text, labelToDepartment);
    if (parsed.error) {
      setRows([]);
      setMessage(parsed.error);
      setProgress(0);
      setBusy(false);
      return;
    }
    setRows(parsed.rows);
    setProgress(100);
    setMessage(`已读取 ${parsed.rows.length} 条记录，可在下方预览并编辑。`);
    setBusy(false);
  }

  async function onImport() {
    if (!canSubmit) return;
    setBusy(true);
    setProgress(20);
    setMessage("正在导入...");
    const response = await fetch("/api/admin/intranet-users/batch-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });
    setProgress(80);
    const result = (await response.json()) as { ok: boolean; message: string };
    setProgress(100);
    setMessage(result.message);
    if (result.ok) setRows([]);
    setBusy(false);
  }

  function updateRow<K extends keyof Row>(index: number, key: K, value: Row[K]) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  return (
    <div className="card" style={{ marginTop: "0.8rem" }}>
      <h3 style={{ marginTop: 0 }}>批量导入（CSV）</h3>
      <p className="meta">流程：下载模板 → 填写并上传 → 预览/编辑 → 点击导入。</p>
      <div className="actions" style={{ marginBottom: "0.6rem" }}>
        <a className="btn btn-neutral" href="/api/admin/intranet-users/template">
          下载 CSV 模板
        </a>
        <label className="btn btn-neutral" style={{ cursor: "pointer" }}>
          上传 CSV
          <input
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <progress value={progress} max={100} style={{ width: "100%" }} />
      {message ? <p className="meta">{message}</p> : null}

      {rows.length > 0 ? (
        <div className="table-wrap" style={{ marginTop: "0.6rem" }}>
          <table>
            <thead>
              <tr>
                <th>用户名</th>
                <th>姓名</th>
                <th>部门</th>
                <th>工号</th>
                <th>手机号</th>
                <th>审批权限</th>
                <th>密码</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.username}-${index}`}>
                  <td>
                    <input value={row.username} onChange={(e) => updateRow(index, "username", e.target.value)} />
                  </td>
                  <td>
                    <input value={row.name} onChange={(e) => updateRow(index, "name", e.target.value)} />
                  </td>
                  <td>
                    <select
                      value={row.department}
                      onChange={(e) => updateRow(index, "department", e.target.value as Department)}
                    >
                      {departmentValues.map((value) => (
                        <option key={value} value={value}>
                          {departmentLabels[value]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input value={row.employeeId} onChange={(e) => updateRow(index, "employeeId", e.target.value)} />
                  </td>
                  <td>
                    <input value={row.contact} onChange={(e) => updateRow(index, "contact", e.target.value)} />
                  </td>
                  <td>
                    <label>
                      <input
                        type="checkbox"
                        style={{ width: "auto" }}
                        checked={row.canApproveFinance}
                        onChange={(e) => updateRow(index, "canApproveFinance", e.target.checked)}
                      />
                      是
                    </label>
                  </td>
                  <td>
                    <input
                      type="password"
                      value={row.password}
                      onChange={(e) => updateRow(index, "password", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="actions" style={{ marginTop: "0.6rem" }}>
        <button className="btn btn-primary" type="button" disabled={!canSubmit} onClick={onImport}>
          确认导入
        </button>
      </div>
    </div>
  );
}
