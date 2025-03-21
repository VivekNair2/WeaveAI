from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.vectordb.pgvector import PgVector
import os 
from agno.vectordb.chroma import ChromaDb
from agno.embedder.google import GeminiEmbedder
import os
from dotenv import load_dotenv
from agno.vectordb.lancedb import LanceDb, SearchType
load_dotenv()
embeddings = GeminiEmbedder()

from dotenv import load_dotenv
load_dotenv()
os.environ['OPENAI_API_KEY']=os.getenv("OPENAI_API_KEY")
knowledge=PDFKnowledgeBase(
        path="data/Resume_JPMC.pdf",
        vector_db=LanceDb(
            uri="tmp/lancedb",
            table_name="resume",
            search_type=SearchType.hybrid,
            embedder=embeddings,
          ),
    reader=PDFReader(chunk=True),
),
