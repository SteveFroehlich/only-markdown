export type AppMode = "file" | "directory"

export interface StatusResponse {
  rootDirectory: string
  lockedFilePath: string | null
  mode: AppMode
}

export interface MarkdownFile {
  name: string
  path: string
}

export interface ListResponse {
  directory: string
  files: MarkdownFile[]
}

export interface RenderResponse {
  success: boolean
  fileName: string
  filePath: string
  html: string
  renderedAt: string
}
