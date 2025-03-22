from agent import RAGAgent,WebAgent
from agno.agent import Agent
from agno.models.google import Gemini
import os
from dotenv import load_dotenv
load_dotenv()
os.environ["GOOGLE_API_KEY"]=os.getenv("GOOGLE_API_KEY")
gemini_model=Gemini(id="gemini-1.5-flash")


rag=RAGAgent("gemini","data/Resume_JPMC.pdf")
rag_agent=rag.agent
web=WebAgent("gemini")
web_agent=web.agent
agent_team = Agent(
    team=[web_agent],
    model=gemini_model,
    instructions=["You are a multi-ai agent that u have to do the task based on the user's query"],
    show_tool_calls=True,
    markdown=True,
)


agent_team.print_response("Give me 5 latest news in mumbai", stream=True)
