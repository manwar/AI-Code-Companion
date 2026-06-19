import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    let panel: vscode.WebviewPanel | undefined = undefined;
    let selectionTimeout: any = undefined;

    let backendProcess: child_process.ChildProcess | undefined = undefined;
    try {
        const pythonPath = '/home/manwar/python-venv/myenv/bin/python';
        const serverPath = path.join(context.extensionPath, 'backend', 'server.py');

        backendProcess = child_process.spawn(pythonPath, [serverPath]);

        backendProcess.stderr?.on('data', (data) => {
            console.error(`Backend log: ${data}`);
        });
    } catch (err) {
        console.error('Failed to automatically start Python backend:', err);
    }

    // Helper function to send selection to the webview safely (supports pre-captured text)
    const updateWebviewSelection = (forcedText?: string) => {
        if (!panel) { return; }

        let text = forcedText;
        if (text === undefined) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                text = editor.document.getText(selection);
            }
        }

        try {
            panel.webview.postMessage({
                command: 'setSelectedCode',
                text: text || ""
            });
        } catch (err) {
            console.warn('Failed to send message to webview panel:', err);
        }
    };

    // Debounce wrapper to prevent high-frequency IPC flooding over the WSL bridge
    const debouncedUpdateSelection = () => {
        if (selectionTimeout) {
            clearTimeout(selectionTimeout);
        }
        selectionTimeout = setTimeout(() => {
            updateWebviewSelection();
        }, 100); // 100ms debounce window
    };

    // Consolidated panel controller to ensure initialization is unified
    const showChatPanel = (preSelectedText?: string) => {
        // If panel already exists, bring it to the front
        if (panel) {
            panel.reveal(vscode.ViewColumn.Two);
            updateWebviewSelection(preSelectedText);
            return;
        }

        // Create and show a new Webview Panel
        panel = vscode.window.createWebviewPanel(
            'aiChat',
            'AI Local Companion',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true // Keeps chat history alive when switching tabs
            }
        );

        const htmlPath = path.join(context.extensionPath, 'src', 'webview.html');

        try {
            // Read file synchronously to completely bypass async cancellation issues in WSL
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            panel.webview.html = htmlContent;

            // Send captured selection safely after loading completes
            setTimeout(() => {
                updateWebviewSelection(preSelectedText);
            }, 500);
        } catch (error: any) {
            vscode.window.showErrorMessage(
                `Extension failed to read webview.html synchronously.\nPath: ${htmlPath}\nError: ${error.message}`
            );
        }

        // Listen for incoming messages from the Webview (User pressing Generate Assistance)
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'requestStream' && panel) {
                try {
                    // Make the fetch request directly from the Node.js Extension Host (unrestricted network)
                    const response = await fetch('http://127.0.0.1:8000/api/stream', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: message.prompt,
                            selected_code: message.selected_code
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Server returned status code ${response.status}`);
                    }

                    // Read incoming chunks safely using standard Web Streams Reader API
                    if (response.body) {
                        const reader = response.body.getReader();

                        while (true) {
                            const { value, done } = await reader.read();
                            if (done) {
                                break;
                            }

                            if (value) {
                                // Safe, robust conversion of chunks using native Node Buffer
                                const rawText = Buffer.from(value).toString('utf8');

                                // Relay the raw SSE chunk straight to the Webview
                                panel.webview.postMessage({
                                    command: 'receiveChunk',
                                    text: rawText
                                });
                            }
                        }

                        // Signal stream completion
                        panel.webview.postMessage({
                            command: 'streamComplete'
                        });
                    }
                } catch (error: any) {
                    panel.webview.postMessage({
                        command: 'streamError',
                        error: error.message || 'Unable to reach backend'
                    });
                }
            }
        }, null, context.subscriptions);

        // Reset panel reference when closed
        panel.onDidDispose(() => {
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }
            panel = undefined;
        }, null, context.subscriptions);
    };

    // Register command 1: Opening chat via Command Palette
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-companion.startChat', () => {
            showChatPanel();
        })
    );

    // Register command 2: Explaining code via Right-click Context Menu (captures selection instantly)
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-companion.explainCode', () => {
            const editor = vscode.window.activeTextEditor;
            let preSelectedText = "";
            if (editor) {
                preSelectedText = editor.document.getText(editor.selection);
            }
            showChatPanel(preSelectedText);
        })
    );

    // 1. Listen for mouse/cursor selection changes with debouncing
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection((event) => {
            if (panel && event.textEditor === vscode.window.activeTextEditor) {
                debouncedUpdateSelection();
            }
        })
    );

    // 2. Listen for editor switches (instant update, no debounce needed)
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            if (panel) {
                updateWebviewSelection();
            }
        })
    );
}

export function deactivate() {}
