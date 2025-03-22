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
        portConnection: 'Text→Instructions' 
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
  }
  // Add more workflow patterns as needed
];