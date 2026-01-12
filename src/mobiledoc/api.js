export const API_BASE = "http://localhost:8081";

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // 에러 메시지(백에서 Msg로 내려줌) 읽기
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `요청 실패 (${res.status})`;
    throw new Error(message);
  }
  return data;
}
// 내정보 DB 저장
export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: "GET" });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || data?.error || `요청 실패 (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || data?.error || `요청 실패 (${res.status})`;
    throw new Error(message);
  }
  return data;
}

