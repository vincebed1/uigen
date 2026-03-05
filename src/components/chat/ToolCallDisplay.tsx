"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args?: Record<string, any>;
  state: "call" | "partial-call" | "result";
  result?: any;
}

interface ToolCallDisplayProps {
  tool: ToolInvocation;
}

function getFileName(path?: string): string {
  if (!path) return "file";
  return path.split("/").filter(Boolean).pop() || path;
}

export function getToolLabel(toolName: string, args?: Record<string, any>): string {
  if (toolName === "str_replace_editor" && args) {
    const filename = getFileName(args.path);
    switch (args.command) {
      case "create":     return `Creating ${filename}`;
      case "str_replace": return `Editing ${filename}`;
      case "insert":     return `Editing ${filename}`;
      case "view":       return `Reading ${filename}`;
    }
  }

  if (toolName === "file_manager" && args) {
    const filename = getFileName(args.path);
    switch (args.command) {
      case "rename": return `Renaming ${filename}`;
      case "delete": return `Deleting ${filename}`;
    }
  }

  return toolName;
}

export function ToolCallDisplay({ tool }: ToolCallDisplayProps) {
  const label = getToolLabel(tool.toolName, tool.args);
  const isDone = tool.state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
