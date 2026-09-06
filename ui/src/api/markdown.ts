import type { ListResponse, RenderResponse, StatusResponse } from "@/types"

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText)
  }
  return data as T
}

export async function getStatus(): Promise<StatusResponse> {
  const res = await fetch("/api/status")
  return parseJson(res)
}

export async function listFiles(): Promise<ListResponse> {
  const res = await fetch("/api/list")
  return parseJson(res)
}

export async function renderFile(filePath: string): Promise<RenderResponse> {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath }),
  })
  return parseJson(res)
}
