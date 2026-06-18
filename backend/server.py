import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ollama import AsyncClient

app = FastAPI()

# Enable Cross-Origin Resource Sharing for secure local operations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodePayload(BaseModel):
    prompt: str
    selected_code: str = ""

async def generate_local_ai_chunks(prompt: str, selected_code: str):
    """
    Connects asynchronously to your local Ollama runner and streams SSE chunks.
    """
    # Recommend highly-efficient specialized coding model
    model_name = "qwen2.5-coder:1.5b"

    system_prompt = (
        "You are an elite, highly precise coding companion. Write secure, optimized "
        "and clean algorithms. Always format code using backticks."
    )

    user_content = f"Active Selection Context:\n```\n{selected_code}\n```\n\nCommand Prompt: {prompt}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ]

    try:
        async_client = AsyncClient()

        # Pull asynchronous response stream
        async for chunk in await async_client.chat(
            model=model_name,
            messages=messages,
            stream=True
        ):
            content = chunk.get("message", {}).get("content", "")
            if content:
                # Format chunk according to SSE standard
                yield f"data: {content}\n\n"
                await asyncio.sleep(0.01)

    except Exception as e:
        yield f"data: Error: {str(e)}. Make sure Ollama is open and 'ollama pull {model_name}' has been executed.\n\n"

@app.post("/api/stream")
async def stream_code_assistance(payload: CodePayload):
    """
    Exposes POST route directly to VS Code webview
    """
    return StreamingResponse(
        generate_local_ai_chunks(payload.prompt, payload.selected_code),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    # Start local listener
    uvicorn.run(app, host="127.0.0.1", port=8000)
