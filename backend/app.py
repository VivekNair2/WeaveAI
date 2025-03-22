from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import TextAgent, RAGAgent, WebAgent,CSVAgent
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
class QueryRequest(BaseModel):
    model: str
    query: str
    instructions: str



@app.post("/text_agent")
def text_agent(request: QueryRequest):
    query_text = request.query
    model_name = request.model
    instructions_text = request.instructions
    agent = TextAgent(model_name, instructions_text)
    return {"response": agent.run_agent(query_text)}

@app.post("/csv_agent")
def csv_agent(model: str = Form(...), query: str = Form(...), file: UploadFile = File(...)):
    agent = CSVAgent(model, file)
    return {"response": agent.run_agent(query)}

@app.post("/rag_agent")
def rag_agent(model: str = Form(...), query: str = Form(...), file: UploadFile = File(...)):
    agent = RAGAgent(model, file)
    return {"response": agent.run_agent(query)}

@app.post("/web_agent")
def web_agent(request: QueryRequest):
    return {"response": f"Processing web query: {request.query}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
