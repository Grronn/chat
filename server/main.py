from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gigachat.models import Messages, MessagesRole
import os, time, uuid, requests
from dotenv import load_dotenv
import uvicorn

load_dotenv()
GIGACHAT_AUTHORIZATION_KEY = os.getenv("GIGACHAT_AUTHORIZATION_KEY") 

app = FastAPI(title="Чат")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel): 
    message: str
    history: list[dict]

# Глобальные переменные токен и время когда он истечет
access_token = ""
token_expires_at = 0

def get_access_token() -> str:
    global access_token, token_expires_at
    if access_token and time.time() < token_expires_at: # если еще не истек токен, то возвращаем его сразу
        return access_token

    url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    rq_uid = str(uuid.uuid4())
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': rq_uid,
        'Authorization': f'Basic {GIGACHAT_AUTHORIZATION_KEY}'
    }
    payload = {'scope': "GIGACHAT_API_PERS"}
    try:
        response = requests.post(url, headers=headers, data=payload, verify=False)
        data = response.json()
        access_token = data.get('access_token')
        token_expires_at = data.get('expires_at')
        return access_token
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения токена: {e}")

@app.post("/chat", summary="Отправить сообщение")
def chat_endpoint(request: ChatRequest, x_session_id: str = Header(None)):
    token = get_access_token()
    # Преобразуем историю сообщений в объекты для GigaChat
    chat_messages = [
        Messages(
            role=MessagesRole.USER if msg["isUser"] else MessagesRole.ASSISTANT,
            content=msg["text"]
        )
        for msg in request.history
    ]
    chat_messages.append(Messages(role=MessagesRole.USER, content=request.message))
    
    url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    payload = {
        "model": "GigaChat-Pro",
        "messages": [msg.dict() for msg in chat_messages],
        "temperature": 1,
        "top_p": 0.1,
        "n": 1,
        "stream": False,
        "max_tokens": 512,
        "repetition_penalty": 1,
        "update_interval": 0
    }
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {token}',
        'X-Session-ID': x_session_id
    }
    try:
        response = requests.post(url, headers=headers, json=payload, verify=False)
        bot_reply = response.json()["choices"][0]["message"]["content"]
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Ошибка запроса к GigaChat: {e}")
    
    return {"message": bot_reply}

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
