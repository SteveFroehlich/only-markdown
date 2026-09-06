import { useCallback, useEffect, useState } from "react"
import { AlertCircle, FileText, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as api from "@/api/markdown"
import type { AppMode, MarkdownFile } from "@/types"
import { cn } from "@/lib/utils"

function shortcutLabel() {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
  return isMac ? "⌘⇧8" : "Ctrl+Shift+8"
}

export default function App() {
  const [mode, setMode] = useState<AppMode>("directory")
  const [rootDirectory, setRootDirectory] = useState<string | null>(null)
  const [files, setFiles] = useState<MarkdownFile[]>([])
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [html, setHtml] = useState<string>("")
  const [renderedAt, setRenderedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showSidebar = mode === "directory"

  const renderPath = useCallback(async (path: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.renderFile(path)
      setFilePath(result.filePath)
      setFileName(result.fileName)
      setHtml(result.html)
      setRenderedAt(result.renderedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    if (filePath) {
      void renderPath(filePath)
    }
  }, [filePath, renderPath])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      setIsLoading(true)
      setError(null)
      try {
        const status = await api.getStatus()
        if (cancelled) return

        setMode(status.mode)
        setRootDirectory(status.rootDirectory)

        if (status.lockedFilePath) {
          await renderPath(status.lockedFilePath)
          return
        }

        const listed = await api.listFiles()
        if (cancelled) return
        setFiles(listed.files)

        if (listed.files.length > 0) {
          await renderPath(listed.files[0].path)
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to start")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [renderPath])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return
      if (event.code !== "Digit8" && event.key !== "8") return
      event.preventDefault()
      refresh()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [refresh])

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold tracking-tight">Only Markdown</h1>
          </div>

          <div className="h-6 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={!filePath || isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <div className="flex-1" />

          {fileName && (
            <span className="text-sm text-muted-foreground font-mono">{fileName}</span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {showSidebar && (
          <aside className="w-56 flex-shrink-0 border-r border-border bg-muted/20 overflow-y-auto">
            <div className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Files
            </div>
            {files.length === 0 ? (
              <p className="px-3 text-sm text-muted-foreground">No .md files here</p>
            ) : (
              <ul className="px-2 pb-3 space-y-0.5">
                {files.map((file) => (
                  <li key={file.path}>
                    <button
                      type="button"
                      onClick={() => void renderPath(file.path)}
                      className={cn(
                        "w-full text-left rounded-md px-2 py-1.5 text-sm truncate transition-colors",
                        file.path === filePath
                          ? "bg-primary/15 text-primary"
                          : "text-foreground/90 hover:bg-accent"
                      )}
                    >
                      {file.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}

        <main className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                Dismiss
              </Button>
            </div>
          )}

          {!filePath && !error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 px-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">No markdown to show</h2>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Start with a .md file or a folder that contains markdown files.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <article
              className="markdown-body px-8 py-8"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </main>
      </div>

      <footer className="flex-shrink-0 border-t border-border px-6 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground gap-4">
          <span className="font-mono truncate">
            {filePath || rootDirectory || "Ready"}
          </span>
          <span className="flex-shrink-0">
            {renderedAt && (
              <span className="mr-3">
                Rendered {new Date(renderedAt).toLocaleTimeString()}
              </span>
            )}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
              {shortcutLabel()}
            </kbd>{" "}
            refresh
          </span>
        </div>
      </footer>
    </div>
  )
}
