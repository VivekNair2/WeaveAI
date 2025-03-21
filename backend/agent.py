from agno.agent import Agent, RunResponse
from agno.models.groq import Groq
from agno.models.google import Gemini
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.csv_toolkit import CsvTools
import os
from agno.tools.zoom import ZoomTools
from dotenv import load_dotenv
from agno.tools.googlesearch import GoogleSearchTools
from agno.tools.email import EmailTools
from agno.models.google import Gemini
from agno.vectordb.lancedb import LanceDb, SearchType
from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.embedder.google import GeminiEmbedder

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
        if not os.path.exists(file_path):
            raise ValueError(f"CSV file not found: {file_path}")
        self.csv=file_path
        csv_name = os.path.basename(file_path)
        self.agent = Agent(
        model=self.model,
        tools=[CsvTools(csvs=[self.csv])],
        markdown=True,
        show_tool_calls=True,
        instructions=[
            f"The CSV file name is {csv_name}",
            "First check the columns in the file",
            "Then run the query to answer the question",
            "Always wrap column names with double quotes if they contain spaces or special characters",
            "Remember to escape the quotes in the JSON string (use \")",
            "Use single quotes for string values"
        ],
        )
    def run_agent(self,query):
        response:RunResponse=self.agent.run(query,stream=False)
        return response.content

        
    
class ZoomAgent:
    def __init__(self, model, account_id, client_id, client_secret):
        if "gemini" in model.lower():
            self.model = gemini_model
        elif "groq" in model.lower():
            self.model = groq_model
            
        self.zoom_tools = ZoomTools(
            account_id=account_id,
            client_id=client_id,
            client_secret=client_secret
        )
        
        self.agent = Agent(
            model=self.model,
            tools=[self.zoom_tools],
            markdown=True,
            show_tool_calls=True
        )
    
    def run_agent(self, query):
        response: RunResponse = self.agent.run(query, stream=False)
        return response.content

class NewsAgent:
    def __init__(self, model):
        if "gemini" in model.lower():
            self.model = gemini_model
        elif "groq" in model.lower():
            self.model = groq_model
        
        self.agent = Agent(
            model=self.model,
            tools=[GoogleSearchTools()],
            description="You are a news agent that helps users find the latest news.",
            instructions=[
                "Given a topic by the user, respond with 4 latest news items about that topic.",
                "Search for 10 news items and select the top 4 unique items.",
                "Search in English and in French."
            ],
            show_tool_calls=True,
            debug_mode=True,
            markdown=True
        )
    
    def run_agent(self, query):
        response: RunResponse = self.agent.run(query, stream=False)
        return response.content

class EmailAgent:
    def __init__(self, model, receiver_email, sender_email, sender_name, sender_passkey):
        if "gemini" in model.lower():
            self.model = gemini_model
        elif "groq" in model.lower():
            self.model = groq_model
        
        self.email_tools = EmailTools(
            receiver_email=receiver_email,
            sender_email=sender_email,
            sender_name=sender_name,
            sender_passkey=sender_passkey
        )
        
        self.agent = Agent(
            model=self.model,
            tools=[self.email_tools],
            markdown=True,
            show_tool_calls=True
        )
    
    def run_agent(self, query):
        response: RunResponse = self.agent.run(query, stream=False)
        return response.content

class RAGAgent:
    def __init__(self, model, pdf_path):
        if "gemini" in model.lower():
            self.model = gemini_model
        elif "groq" in model.lower():
            self.model = groq_model

        from agno.vectordb.lancedb import LanceDb, SearchType
        from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
        from agno.embedder.google import GeminiEmbedder
        
        embeddings = GeminiEmbedder()
        
        self.agent = Agent(
            model=self.model,
            instructions="""You are a passionate and knowledgeable AI assistant who can answer questions about various topics. 
            Your responses should be informative and well-researched. Please provide detailed explanations for your answers. 
            If you don't have enough information to answer the question, please say so and ask for more details.""",
            knowledge=PDFKnowledgeBase(
                path=pdf_path,
                vector_db=LanceDb(
                    uri="tmp/lancedb",
                    table_name="documents",
                    search_type=SearchType.hybrid,
                    embedder=embeddings,
                ),
                reader=PDFReader(chunk=True),
            ),
            show_tool_calls=True,
            markdown=True,
            add_references=True,
        )
        
        if self.agent.knowledge is not None:
            self.agent.knowledge.load()
    
    def run_agent(self, query):
        response: RunResponse = self.agent.run(query, stream=False)
        return response.content

# # Example usage:
# # Text Agent example
# text_agent = TextAgent(
#     model="groq",
#     instructions="You are a helpful assistant that provides information about programming.",
#     tools=[DuckDuckGoTools()]
# )
# print(text_agent.run_agent("What are the key features of Python?"))

# # CSV Agent example
# csv_agent = CSVAgent(model="groq", file_path="customer_dataset.csv")
# print(csv_agent.run_agent("who has work address Gymnasium?"))

# # Zoom Agent example
# zoom_agent = ZoomAgent(
#     model="groq",
#     account_id=os.getenv("ZOOM_ACCOUNT_ID"),
#     client_id=os.getenv("ZOOM_CLIENT_ID"),
#     client_secret=os.getenv("ZOOM_CLIENT_SECRET")
# )
# print(zoom_agent.run_agent("Schedule a team meeting for tomorrow at 2 PM UTC"))

# # News Agent example
# news_agent = NewsAgent(model="groq")
# print(news_agent.run_agent("Latest news about artificial intelligence"))

# # Email Agent example
# email_agent = EmailAgent(
#     model="groq",
#     receiver_email=os.getenv("receiver_email"),
#     sender_email=os.getenv("sender_email"),
#     sender_name=os.getenv("sender_name"),
#     sender_passkey=os.getenv("sender_passkey")
# )
# print(email_agent.run_agent("Send an email about the upcoming team meeting"))

# RAG Agent example
rag_agent = RAGAgent(model="gemini", pdf_path="D2KProblemStatements.pdf")
print(rag_agent.run_agent("What are the problem statement?"))