"use client"

import { useEffect, useRef, useState } from "react"
import { Editor, type Monaco, type OnMount } from "@monaco-editor/react"
import { Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
}

export default function CodeEditor({ value, onChange, language = "lua", height = "200px" }: CodeEditorProps) {
  const { theme } = useTheme()
  const [isEditorReady, setIsEditorReady] = useState(false)
  const monacoRef = useRef<Monaco | null>(null)
  const editorRef = useRef<any>(null)

  // Configure Monaco editor on mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    setIsEditorReady(true)

    // Configure Lua language
    configureLuaLanguage(monaco)

    // Focus the editor
    editor.focus()

    // Set editor options for VS Code-like experience
    editor.updateOptions({
      fontFamily: "'Fira Code', Menlo, Monaco, 'Courier New', monospace",
      fontSize: 14,
      lineHeight: 21,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      scrollbar: {
        vertical: "auto",
        horizontal: "auto",
      },
      lineNumbers: "on",
      glyphMargin: true,
      folding: true,
      bracketPairColorization: {
        enabled: true,
      },
      "semanticHighlighting.enabled": true,
    })
  }

  // Configure Lua language features
  const configureLuaLanguage = (monaco: Monaco) => {
    // Register Lua language if not already registered
    if (!monaco.languages.getLanguages().some((lang) => lang.id === "lua")) {
      // Define Lua keywords for syntax highlighting and auto-completion
      const luaKeywords = [
        "and",
        "break",
        "do",
        "else",
        "elseif",
        "end",
        "false",
        "for",
        "function",
        "if",
        "in",
        "local",
        "nil",
        "not",
        "or",
        "repeat",
        "return",
        "then",
        "true",
        "until",
        "while",
      ]

      // Roblox specific functions and libraries
      const robloxFunctions = [
        "print",
        "warn",
        "error",
        "wait",
        "spawn",
        "delay",
        "tick",
        "time",
        "workspace",
        "game",
        "script",
        "Instance.new",
        "Vector3.new",
        "CFrame.new",
        "Color3.new",
        "Color3.fromRGB",
        "math.random",
        "math.floor",
        "math.ceil",
        "string.format",
        "string.sub",
        "string.find",
        "table.insert",
        "table.remove",
      ]

      // Register Lua language
      monaco.languages.register({ id: "lua" })

      // Define Lua language configuration
      monaco.languages.setMonarchTokensProvider("lua", {
        defaultToken: "",
        tokenPostfix: ".lua",

        keywords: luaKeywords,

        builtins: robloxFunctions,

        operators: [
          "+",
          "-",
          "*",
          "/",
          "%",
          "^",
          "#",
          "==",
          "~=",
          "<=",
          ">=",
          "<",
          ">",
          "=",
          "(",
          ")",
          "{",
          "}",
          "[",
          "]",
          ";",
          ":",
          ",",
          ".",
          "..",
          "...",
        ],

        // we include these common regular expressions
        symbols: /[=><!~?:&|+\-*/^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        // The main tokenizer for our languages
        tokenizer: {
          root: [
            // identifiers and keywords
            [
              /[a-zA-Z_]\w*/,
              {
                cases: {
                  "@keywords": "keyword",
                  "@builtins": "type",
                  "@default": "identifier",
                },
              },
            ],

            // whitespace
            { include: "@whitespace" },

            // delimiters and operators
            [/[{}()[\]]/, "@brackets"],
            [/[<>](?!@symbols)/, "@brackets"],
            [
              /@symbols/,
              {
                cases: {
                  "@operators": "operator",
                  "@default": "",
                },
              },
            ],

            // numbers
            [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
            [/0[xX][0-9a-fA-F]+/, "number.hex"],
            [/\d+/, "number"],

            // delimiter: after number because of .\d floats
            [/[;,.]/, "delimiter"],

            // strings
            [/"([^"\\]|\\.)*$/, "string.invalid"], // non-terminated string
            [/'([^'\\]|\\.)*$/, "string.invalid"], // non-terminated string
            [/"/, "string", "@string_double"],
            [/'/, "string", "@string_single"],

            // comments
            [/--\[\[.*\]\]/, "comment"],
            [/--.*$/, "comment"],
          ],

          whitespace: [[/[ \t\r\n]+/, ""]],

          string_double: [
            [/[^\\"]+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./, "string.escape.invalid"],
            [/"/, "string", "@pop"],
          ],

          string_single: [
            [/[^\\']+/, "string"],
            [/@escapes/, "string.escape"],
            [/\\./, "string.escape.invalid"],
            [/'/, "string", "@pop"],
          ],

          bracketCounting: [
            [/\{/, "delimiter.bracket", "@bracketCounting"],
            [/\}/, "delimiter.bracket", "@pop"],
            { include: "root" },
          ],
        },
      })

      // Register completions provider
      monaco.languages.registerCompletionItemProvider("lua", {
        provideCompletionItems: (model, position) => {
          const suggestions = [
            ...luaKeywords.map((keyword) => ({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
            })),
            ...robloxFunctions.map((func) => ({
              label: func,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: func,
              detail: "Roblox Function",
            })),
            // Common code snippets
            {
              label: "if-then",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "if ${1:condition} then\n\t${2}\nend",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: "If statement",
            },
            {
              label: "if-then-else",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "if ${1:condition} then\n\t${2}\nelse\n\t${3}\nend",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: "If-else statement",
            },
            {
              label: "for-loop",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "for ${1:i} = ${2:1}, ${3:10} do\n\t${4}\nend",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: "Numeric for loop",
            },
            {
              label: "function",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "function ${1:name}(${2:params})\n\t${3}\nend",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: "Function declaration",
            },
          ]

          return { suggestions }
        },
      })
    }
  }

  // Update editor theme when site theme changes
  useEffect(() => {
    if (monacoRef.current) {
      const monaco = monacoRef.current
      monaco.editor.defineTheme("vs-dark-custom", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#1e1e1e",
        },
      })

      monaco.editor.defineTheme("vs-light-custom", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#ffffff",
        },
      })

      const currentTheme = theme === "dark" ? "vs-dark-custom" : "vs-light-custom"
      monaco.editor.setTheme(currentTheme)
    }
  }, [theme, monacoRef.current])

  return (
    <div className="border rounded-md overflow-hidden">
      {!isEditorReady && (
        <div className="flex items-center justify-center p-4 h-[200px] bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(value) => onChange(value || "")}
        onMount={handleEditorDidMount}
        options={{
          readOnly: false,
          minimap: { enabled: true },
          fontFamily: "'Fira Code', Menlo, Monaco, 'Courier New', monospace",
          fontSize: 14,
        }}
        loading={
          <div className="flex items-center justify-center p-4 h-full bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      />
    </div>
  )
}
