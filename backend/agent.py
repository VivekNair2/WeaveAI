from agno.agent import Agent, RunResponse
from agno.models.groq import Groq
from agno.models.google import Gemini
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.csv_toolkit import CsvTools
import os
from dotenv import load_dotenv
from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.embedder.google import GeminiEmbedder
from agno.vectordb.lancedb import LanceDb, SearchType
embeddings=GeminiEmbedder()

from test import knowledge
load_dotenv()
os.environ["GROQ_API_KEY"]=os.getenv("GROQ_API_KEY")
os.environ["GOOGLE_API_KEY"]=os.getenv("GOOGLE_API_KEY")
gemini_model=Gemini(id="gemini-1.5-flash")
groq_model=Groq(id="llama-3.3-70b-versatile")

class TextAgent:
    def __init__(self, model,instructions, tools):
        if "gemini" in model.lower():
            self.model=gemini_model
        elif "groq" in model.lower():
            self.model=groq_model
       
        self.instructions=instructions
        self.tools=tools
        self.agent=Agent(
        model=self.model,
        knowledge=PDFKnowledgeBase(
        path="data/Resume_JPMC.pdf",
        vector_db=LanceDb(
            uri="tmp/lancedb",
            table_name="payslip",
            search_type=SearchType.hybrid,
            embedder=embeddings,
          ),
        reader=PDFReader(chunk=True),
        )   ,
    show_tool_calls=True,
    markdown=True,
    add_references=True, 
)
        description=self.instructions,
        tools=self.tools,
        markdown=True
        
        if self.agent.knowledge is not None:
            self.agent.knowledge.load()
    def run_agent(self,query):
        response:RunResponse=self.agent.run(query,stream=False)
        return response.content
    
class CSVAgent:
    def __init__ (self,model,file_path):
        if "gemini" in model.lower():
            self.model=gemini_model
        elif "groq" in model.lower():
            self.model=groq_model
        self.csv=file_path
        self.agent = Agent(
        model=self.model,
    
        tools=[CsvTools(csvs=[self.csv])],
        markdown=True,
        show_tool_calls=True,
        instructions=[
            "First always get the list of files",
            "Then check the columns in the file",
            "Then run the query to answer the question",
            "Always wrap column names with double quotes if they contain spaces or special characters",
            "Remember to escape the quotes in the JSON string (use \")",
            "Use single quotes for string values"
        ],
        )
    def run_agent(self,query):
        response:RunResponse=self.agent.run(query,stream=False)
        return response.content

        
    
agent=TextAgent(model="gemini",instructions="You are a passionate and knowledgable AI assistant who can answer questions about various topics. Your responses should be informative and well-researched. Please provide detailed explanations for your answers. If you don't have enough information to answer the question, please say so and ask for more details.",tools=[DuckDuckGoTools()])
print(agent.run_agent("Find me latest news of Mumbai using tool"))
        


