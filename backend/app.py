from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import TextAgent, RAGAgent, WebAgent, CSVAgent, ZoomAgent
from workflow import MarketingEmailWorkflow
import pandas as pd
import io
import os

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
    
class ZoomRequest(BaseModel):
    account_id: str
    client_id: str
    client_secret: str
    query: str

class WorkflowRequest(BaseModel):
    session_id: str
    sender_email: str
    sender_name: str
    sender_passkey: str
    company_name: str
    product_description: str
    use_cached_results: bool = True
    max_retries: int = 3
    retry_delay: int = 5

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
    agent = RAGAgent(model, file)  # Pass the UploadFile object, not a string
    return {"response": agent.run_agent(query)}

@app.post("/web_agent")
def web_agent(request: QueryRequest):
    query_text = request.query
    model_name = request.model
    agent = WebAgent(model_name)
    return {"response": agent.run_agent(query_text)}
    
@app.post("/zoom_agent")
def zoom_agent(request: ZoomRequest):
    account_id = request.account_id
    client_id = request.client_id
    client_secret = request.client_secret
    model = "gemini"
    query = request.query
    agent = ZoomAgent(model, account_id, client_id, client_secret)
    return {"response": agent.run_agent(query)}

@app.post("/voice_agent")
def voice_agent():
    os.system(f'lk dispatch create --new-room --agent-name outbound-caller --metadata +917769915068')

@app.post("/workflow_agent")
def workflow_agent(
    session_id: str = Form(...),
    sender_email: str = Form(...),
    sender_name: str = Form(...),
    sender_passkey: str = Form(...),
    company_name: str = Form(...),
    product_description: str = Form(...),
    use_cached_results: bool = Form(True),
    max_retries: int = Form(3),
    retry_delay: int = Form(5),
    csv_file: UploadFile = File(...)
):
    workflow = MarketingEmailWorkflow(
        session_id=session_id,
        csv_file=csv_file,
        sender_email=sender_email,
        sender_name=sender_name,
        sender_passkey=sender_passkey
    )
    responses = workflow.run(
        company_name=company_name,
        product_description=product_description,
        use_cached_results=use_cached_results,
        max_retries=max_retries,
        retry_delay=retry_delay
    )
    return {"responses": [response.content for response in responses]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)