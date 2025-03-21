from agno.agent import Agent
from agno.tools.firecrawl import FirecrawlTools
from dotenv import load_dotenv
import os
load_dotenv()
os.environ["FIRECRAWL_API_KEY"]=os.getenv(  "FIRECRAWL_API_KEY" )

from agno.models.groq import Groq
agent = Agent(model=Groq(id="llama-3.3-70b-versatile"),
              tools=[FirecrawlTools(scrape=False, crawl=True)], show_tool_calls=True, markdown=True)
agent.print_response("Summarize this https://finance.yahoo.com/")