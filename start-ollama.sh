docker run -d \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  --restart unless-stopped \
  -e OLLAMA_HOST=0.0.0.0 \
  ollama/ollama
