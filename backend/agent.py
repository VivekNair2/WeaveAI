from agno.agent import Agent, RunResponse
from agno.models.groq import Groq
from agno.models.google import Gemini
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.csv_toolkit import CsvTools
import os
from dotenv import load_dotenv
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
        description=self.instructions,
        tools=self.tools,
        markdown=True
        )
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
        knowledge=
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

        
    
agent=CSVAgent(model="gemini",file_path="customer_dataset.csv")
print(agent.run_agent("who has work adress Gymnasium?"))
        


