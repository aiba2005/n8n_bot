from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class ChatRequest(BaseModel):

    message:str



@app.post("/chat")
def chat(data:ChatRequest):

    try:

        r=requests.post(

            "http://localhost:5678/webhook/chat",

            json={
                "message":data.message
            },

            timeout=60

        )


        result=r.json()


        return result


    except Exception as e:


        return {

            "text":
            f"Ошибка: {str(e)}"

        }