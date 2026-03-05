import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay, getToolLabel } from "../ToolCallDisplay";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })).toBe("Editing Card.jsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/components/Card.jsx" })).toBe("Editing Card.jsx");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Reading App.jsx");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming old.jsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/components/Card.jsx" })).toBe("Deleting Card.jsx");
});

test("getToolLabel: unknown tool name falls back to tool name", () => {
  expect(getToolLabel("some_other_tool", { command: "foo" })).toBe("some_other_tool");
});

test("getToolLabel: missing path falls back to 'file'", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getToolLabel: no args falls back to tool name", () => {
  expect(getToolLabel("str_replace_editor")).toBe("str_replace_editor");
});

test("getToolLabel: nested path extracts filename correctly", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/components/ui/Button.tsx" })).toBe("Creating Button.tsx");
});

// --- ToolCallDisplay render tests ---

test("ToolCallDisplay shows label when done", () => {
  render(
    <ToolCallDisplay
      tool={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("ToolCallDisplay shows label while in progress", () => {
  render(
    <ToolCallDisplay
      tool={{ toolName: "str_replace_editor", args: { command: "str_replace", path: "/Card.jsx" }, state: "call" }}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("ToolCallDisplay shows green dot when state is result", () => {
  const { container } = render(
    <ToolCallDisplay
      tool={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "result", result: "ok" }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallDisplay shows spinner when state is call", () => {
  const { container } = render(
    <ToolCallDisplay
      tool={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "call" }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallDisplay shows spinner when state is partial-call", () => {
  const { container } = render(
    <ToolCallDisplay
      tool={{ toolName: "str_replace_editor", args: { command: "create", path: "/App.jsx" }, state: "partial-call" }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("ToolCallDisplay shows raw tool name for unknown tools", () => {
  render(
    <ToolCallDisplay
      tool={{ toolName: "unknown_tool", args: {}, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("ToolCallDisplay renders file_manager delete correctly", () => {
  render(
    <ToolCallDisplay
      tool={{ toolName: "file_manager", args: { command: "delete", path: "/old.jsx" }, state: "result", result: "ok" }}
    />
  );
  expect(screen.getByText("Deleting old.jsx")).toBeDefined();
});
