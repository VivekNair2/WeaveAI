from agno.agent import Agent
from agno.tools.firecrawl import FirecrawlTools
from agno.models.google import Gemini
from dotenv import load_dotenv
import os
load_dotenv()
os.environ["FIRECRAWL_API_KEY"]=os.getenv(  "FIRECRAWL_API_KEY" )
os.environ["GROQ_API_KEY"]=os.getenv("GROQ_API_KEY")
os.environ["GOOGLE_API_KEY"]=os.getenv("GOOGLE_API_KEY")
gemini_model=Gemini(id="gemini-1.5-flash")
from agno.agent import Agent
from agno.tools.crawl4ai import Crawl4aiTools

agent = Agent(model=Gemini(id="gemini-1.5-flash"),tools=[Crawl4aiTools(max_length=None)], show_tool_calls=True)
agent.print_response("Tell me about https://github.com/agno-agi/agno.")