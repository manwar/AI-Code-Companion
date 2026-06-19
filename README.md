## AI Code Companion

To deploy the code, clone the repository as below:

```bash
$ git clone https://github.com/manwar/AI-Code-Companion.git
$ cd AI-Code-Companion
```

You should see directory structure as below:

```bash
.
├── README.md
├── backend
│   └── server.py
├── install-qwen.sh
├── package-lock.json
├── package.json
├── src
│   ├── extension.ts
│   └── webview.html
├── start-ollama.sh
└── tsconfig.json
```

One Time Setup:

```bash
$ npm install
$ npm run compile
$ mkdir -p ~/.vscode-server/extensions/local-ai-companion-1.0.0/
$ cp -r out/ src/ backend/ package.json ~/.vscode-server/extensions/local-ai-companion-1.0.0/
$ ./start-ollama.sh
$ ./install-qwen.sh
```

Inside VS Code, open any script and select the code you want AI to explain then right click and select "AI: Explain Selected Code".
Finally type `explain` in the comment.
Then click the `Generate Assistance` button to see the result.
