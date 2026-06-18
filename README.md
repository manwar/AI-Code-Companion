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

One time setup:

```bash
$ npm install
$ npx tsc -p ./
$ ./start-ollama.sh
$ ./install-qwen.sh
```

Now start the server:

```bash
$ python backend/server.py
(myenv) manwar@manwar:~/AI-Code-Companion$ python backend/server.py
INFO:     Started server process [635821]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Open VSCode Editor, inside open the folder, `AI-Code-Companion`.
Then press `F5` to open the extension window.
Now open any script in the window.
Select the code you want AI to explain then right click and select "AI: Explain Selected Code".
Finally type `explain` in the comment.
Then click the `Generate Assistance` button to see the result.
