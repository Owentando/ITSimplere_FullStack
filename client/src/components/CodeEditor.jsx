import Editor from "@monaco-editor/react";

function CodeEditor({ value, onChange, language, theme = "dark" }) {

    return (
        <div>
            <h3>Code Editor</h3>

            <Editor
                height="400px"
                theme={theme === "light" ? "vs" : "vs-dark"}
                language={language}
                value={value}
                onChange={(newValue) => onChange(newValue || "")}
                options={{
                    bracketPairColorization: {
                        enabled: true
                    },
                    matchBrackets: "always",
                    wordWrap: "on",
                    minimap: {
                        enabled: true
                    },
                    automaticLayout: true
                }}
            />
        </div>
    );
}

export default CodeEditor;