export interface ConnectionPattern {
  nodeConnection: string;
  portConnection: string;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  requiredNodeTypes: string[];
  connections: ConnectionPattern[];
  endpoint: string;
}

export const workflowPatterns: WorkflowPattern[] = [
  // Email Marketing - most complex (6 nodes, 6 connections)
  {
    id: 'email-marketing',
    name: 'Email Marketing Workflow',
    requiredNodeTypes: [
      'File-Input-Tool', 
      'CSV-Agent', 
      'Text-Input-Tool', 
      'Text-Agent', 
      'Email-Tool', 
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'File-Input-Tool→CSV-Agent',
        portConnection: 'File→File' 
      },
      { 
        nodeConnection: 'CSV-Agent→Text-Agent',
        portConnection: 'Personal Description→Tools' 
      },
      { 
        nodeConnection: 'CSV-Agent→Email-Tool',
        portConnection: 'Receiver Emails→Receiver Emails' 
      },
      { 
        nodeConnection: 'Text-Input-Tool→Text-Agent',
        portConnection: 'Text→Instructions' 
      },
      { 
        nodeConnection: 'Text-Agent→Email-Tool',
        portConnection: 'Output→Email Description' 
      },
      { 
        nodeConnection: 'Email-Tool→End',
        portConnection: 'Status→End' 
      }
    ],
    endpoint: 'http://localhost:8000/email_agent'
  },
  // Marketing Cold Caller (5 nodes, 4 connections)
  {
    id: 'marketing-cold-caller',
    name: 'Marketing Cold Caller Workflow',
    requiredNodeTypes: [
      'File-Input-Tool', 
      'CSV-Agent', 
      'Voice-Agent', 
      'WhatsApp-Tool', 
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'File-Input-Tool→CSV-Agent',
        portConnection: 'File→File' 
      },
      { 
        nodeConnection: 'WhatsApp-Tool→Voice-Agent',
        portConnection: 'Output→Tools' 
      },
      { 
        nodeConnection: 'CSV-Agent→Voice-Agent',
        portConnection: 'Personal Description→Instructions' 
      },
      { 
        nodeConnection: 'Voice-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/voice_agent'
  },
  // CSV Agent (4 nodes, 3 connections)
  {
    id: 'csv-agent',
    name: 'CSV Agent Workflow',
    requiredNodeTypes: [
      'CSV-Agent',
      'File-Input-Tool',
      'Text-Input-Tool',
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'File-Input-Tool→CSV-Agent',
        portConnection: 'File→File' 
      },
      { 
        nodeConnection: 'Text-Input-Tool→CSV-Agent',
        portConnection: 'Text→Query' 
      },
      { 
        nodeConnection: 'CSV-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/csv_agent'
  },
  // Web Search (4 nodes, 3 connections)
  {
    id: 'web-search',
    name: 'Web Search Workflow',
    requiredNodeTypes: [
      'Web-Search-Tool',
      'Text-Agent',
      'Text-Input-Tool',
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'Text-Input-Tool→Text-Agent',
        portConnection: 'Text→Query' 
      },
      { 
        nodeConnection: 'Web-Search-Tool→Text-Agent',
        portConnection: 'Tool→Tools' 
      },
      { 
        nodeConnection: 'Text-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/web_agent'
  },
  // RAG (4 nodes, 3 connections)
  {
    id: 'rag',
    name: 'RAG Workflow',
    requiredNodeTypes: [
      'Text-Agent',
      'Text-Input-Tool',
      'Knowledge-Base',
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'Text-Input-Tool→Text-Agent',
        portConnection: 'Text→Query' 
      },
      { 
        nodeConnection: 'Knowledge-Base→Text-Agent',
        portConnection: 'Content→Tools' 
      },
      { 
        nodeConnection: 'Text-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/rag_agent'
  },
  // Text Agent (3 nodes, 2 connections)
  {
    id: 'text-agent',
    name: 'Text Agent Workflow',
    requiredNodeTypes: [
      'Text-Agent',
      'Text-Input-Tool',
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'Text-Input-Tool→Text-Agent',
        portConnection: 'Text→Query' 
      },
      { 
        nodeConnection: 'Text-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/text_agent'
  },
  // Zoom Tool (2 nodes, 1 connection)
  {
    id: 'zoom-tool',
    name: 'Zoom Agent',
    requiredNodeTypes: [
      'Zoom-Tool',
      'End'
    ],
    connections: [
      {
        nodeConnection: 'Zoom-Tool→End',
        portConnection: 'Output→End'
      }
    ],
    endpoint: 'http://localhost:8000/zoom_agent'
  }
  // Add more workflow patterns as needed
];