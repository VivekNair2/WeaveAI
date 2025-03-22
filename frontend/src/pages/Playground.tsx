import { useState, useEffect } from 'react';
import Sidebar from '../components/playground/Sidebar';
import Workspace from '../components/playground/Workspace';
import { NodeData, EdgeData, DataType } from '../types/nodeTypes';
// Add these imports for icons
import { BiMessageDetail } from 'react-icons/bi';
import { BsMicFill, BsFileEarmarkText, BsFileEarmark } from 'react-icons/bs';
import { MdEmail, MdTextFields, MdOutlineOutput } from 'react-icons/md';
import { FiPaperclip, FiSearch } from 'react-icons/fi';
import { AiOutlineSound } from 'react-icons/ai';
import { FaDatabase } from 'react-icons/fa';
// Add this import at the top
import { useNavigate, useLocation } from 'react-router-dom';
// Add this import at the top
import { workflowPatterns } from '../utils/workflowPatterns';
// Add imports at the top of your file
import { 
  ApiEndpoint, 
  TextAgentRequest, 
  WebAgentRequest,
  sendJsonRequest,
  sendFormDataRequest,
  sendVoiceAgentRequest,
  ApiResponse
} from '../types/apiTypes';

// Define Template interface
interface Template {
  id: string;
  name: string;
  nodes: NodeData[];
  edges: EdgeData[];
  createdAt: string;
}

export const nodeTemplates: Record<string, { inputs: any[], outputs: any[], icon: React.ElementType }> = {
  "End": {
    inputs: [
      { id: 'input-1', name: 'End', type: 'none', fieldType: 'input' }
    ],
    outputs: [],
    icon: BsFileEarmark // You may want to replace with a more appropriate icon
  },
  "Text-Agent": {
    inputs: [
      { id: 'input-1', name: 'Tools', type: 'tool', fieldType: 'none' },
      { id: 'input-2', name: 'Instructions', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: 'Query', type: 'none', fieldType: 'input' },
      { id: 'input-4', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] },
      { id: 'input-5', name: 'API Key', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output' },
    ],
    icon: BiMessageDetail
  },
"Voice-Agent": {
    inputs: [
      { id: 'input-1', name: 'Tools', type: 'tool', fieldType: 'none' },
      { id: 'input-2', name: 'STT', type: 'string', fieldType: 'input', options: ['OpenAI', 'Google', 'Azure', 'Assembly AI'] },
      { id: 'input-3', name: 'TTS', type: 'string', fieldType: 'input', options: ['OpenAI', 'ElevenLabs', 'Deepgram', 'Google'] },
      { id: 'input-4', name: 'Language', type: 'string', fieldType: 'input' },
      { id: 'input-5', name: 'Instructions', type: 'none', fieldType: 'input' },
      { id: 'input-6', name: 'To Phone Number', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output' },

    ],
    icon: BsMicFill
  },
  "CSV-Agent": {
    inputs: [
      { id: 'input-1', name: 'File', type: 'none', fieldType: 'input' },
      { id: 'input-2', name: 'Instructions', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Personal Description', type: 'string', fieldType: 'output' },
      { id: 'output-2', name: 'Receiver Emails', type: 'string', fieldType: 'output' },
      { id: 'output-3', name: 'Output', type: 'string', fieldType: 'output' },
    ],
    icon: BsFileEarmarkText
  },
  "Email-Tool": {
    inputs: [
      { id: 'input-1', name: 'Sender Mail', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'Passkey', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: "Sender's Name", type: 'string', fieldType: 'input' },
      { id: 'input-4', name: "Receiver Emails", type: 'none', fieldType: 'input' },
      { id: 'input-5', name: "Email Description", type: 'none', fieldType: 'input' },
    ],
    outputs: [
      { id: 'output-1', name: 'Status', type: 'string', fieldType: 'output' }
    ],
    icon: MdEmail
  },
  "Text-Input-Tool": {
    inputs: [
      { id: 'input-1', name: 'Text', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Text', type: 'string', fieldType: 'output' }
    ],
    icon: MdTextFields
  },
  "File-Input-Tool": {
    inputs: [
      { id: 'input-1', name: 'File', type: 'file', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'File', type: 'file', fieldType: 'output' }
    ],
    icon: FiPaperclip
  },
  "Text-Output-Tool": {
    inputs: [
      { id: 'input-1', name: 'Text', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output', display: true }
    ],
    icon: MdOutlineOutput
  },
  "Knowledge-Base": {
    inputs: [
      { id: 'input-1', name: 'File', type: 'file', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Content', type: 'string', fieldType: 'output', display: false }
    ],
    icon: FaDatabase
  },
  "Web-Search-Tool": {
    inputs: [

    ],
    outputs: [
      { id: 'output-1', name: 'Tool', type: 'string', fieldType: 'output', display: false }
    ],
    icon: FiSearch
  },
  "WhatsApp-Tool": {
    inputs: [],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output', display: false }
    ],
    icon: BiMessageDetail  // You might want to import BsWhatsapp from react-icons/bs for a more specific icon
  },
};

const Playground = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplateSaveModalOpen, setIsTemplateSaveModalOpen] = useState(false);
  // Add these states for execution status
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string } | null>(null);
  const navigate = useNavigate();

  // Load templates from localStorage on component mount
  useEffect(() => {
    // Existing code for loading templates from localStorage
    const savedTemplates = localStorage.getItem('d2k-templates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error("Error loading templates:", e);
      }
    }

    // Check if there's a template to load from the Templates page
    const templateToLoad = sessionStorage.getItem('template-to-load');
    if (templateToLoad) {
      try {
        const template = JSON.parse(templateToLoad);
        setNodes(template.nodes);
        setEdges(template.edges);
        // Clear the sessionStorage item after loading
        sessionStorage.removeItem('template-to-load');
      } catch (e) {
        console.error("Error loading template from session storage:", e);
      }
    }
  }, []);

  // Save templates to localStorage when they change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('d2k-templates', JSON.stringify(templates));
    }
  }, [templates]);

  const handleSaveTemplate = (templateName: string) => {
    if (!templateName.trim()) return;
    
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: templateName,
      nodes: [...nodes],
      edges: [...edges],
      createdAt: new Date().toISOString()
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    setIsTemplateSaveModalOpen(false);
  };

  const handleAddNode = (nodeType: string) => {
    const template = nodeTemplates[nodeType];
    const newNode: NodeData = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position: { x: 100, y: 100 },
      data: { 
        label: nodeType,
        inputs: template.inputs.map(input => ({...input, id: `${input.id}-${Date.now()}`})),
        outputs: template.outputs.map(output => ({...output, id: `${output.id}-${Date.now()}`}))
      }
    };
    
    setNodes([...nodes, newNode]);
  };

  const handleNodeDrop = (nodeType: string, position: { x: number, y: number }) => {
    const template = nodeTemplates[nodeType];
    if (!template) return;
    
    const newNode: NodeData = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position,
      data: { 
        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        inputs: template.inputs.map(input => ({...input, id: `${input.id}-${Date.now()}`})),
        outputs: template.outputs.map(output => ({...output, id: `${output.id}-${Date.now()}`}))
      }
    };
    
    setNodes(prevNodes => [...prevNodes, newNode]);
  };

  const handleAddEdge = (edge: EdgeData) => {
    // Check if an edge with the same source and target already exists
    const edgeExists = edges.some(
      e => e.source === edge.source && e.target === edge.target && 
           e.sourceHandle === edge.sourceHandle && e.targetHandle === edge.targetHandle
    );

    if (!edgeExists) {
      setEdges([...edges, { ...edge, id: `edge-${Date.now()}` }]);
    }
  };

  const handleRemoveEdge = (edgeId: string) => {
    setEdges(edges.filter(edge => edge.id !== edgeId));
  };

  // New useEffect: Display concise data payload with node's essential info and its connected edges
  useEffect(() => {
    if (edges.length > 0) {
      const payload = nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: {
          label: node.data.label,
          inputs: node.data.inputs.map(input => ({
            id: input.id,
            name: input.name,
            type: input.type,
            fieldType: input.fieldType,
            value: input.value || null // This explicitly includes the user input values
          })),
          outputs: node.data.outputs.map(output => ({
            id: output.id,
            name: output.name,
            type: output.type,
            fieldType: output.fieldType,
            value: output.value || null
          }))
        },
        connectedEdges: edges
          .filter(edge => edge.source === node.id || edge.target === node.id)
          .map(edge => ({
            id: edge.id,
            source: edge.source,
            sourceHandle: edge.sourceHandle,
            target: edge.target,
            targetHandle: edge.targetHandle
          }))
      }));
      console.log("Data to send to backend:", JSON.stringify(payload, null, 2));
    }
  }, [edges, nodes]);

// Generic workflow pattern checker
const checkWorkflowPattern = (nodes: NodeData[], edges: EdgeData[], patternId: string): boolean => {
  const pattern = workflowPatterns.find(p => p.id === patternId);
  if (!pattern) return false;

  // 1. Check if all required node types are present
  const nodeTypeMap: Record<string, NodeData[]> = {};
  nodes.forEach(node => {
    if (!nodeTypeMap[node.type]) {
      nodeTypeMap[node.type] = [];
    }
    nodeTypeMap[node.type].push(node);
  });
  
  for (const type of pattern.requiredNodeTypes) {
    if (!nodeTypeMap[type] || nodeTypeMap[type].length === 0) {
      return false; // Missing a required node type
    }
  }
  
  // 2. Check if connections match the expected pattern
  // Build a map to easily check connections
  const connections: Record<string, string[]> = {};
  
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    const connection = `${sourceNode.type}→${targetNode.type}`;
    if (!connections[connection]) {
      connections[connection] = [];
    }
    
    // Add information about which ports are connected
    const sourceOutput = sourceNode.data.outputs.find(o => o.id === edge.sourceHandle);
    const targetInput = targetNode.data.inputs.find(i => i.id === edge.targetHandle);
    
    if (sourceOutput && targetInput) {
      connections[connection].push(`${sourceOutput.name}→${targetInput.name}`);
    }
  });
  
  // Check if all pattern connections exist
  for (const { nodeConnection, portConnection } of pattern.connections) {
    // Check if this connection type exists
    if (!connections[nodeConnection]) {
      return false;
    }
    
    // Check if a connection between the right ports exists
    // Since port names might vary, we use a more flexible check
    const matchFound = connections[nodeConnection].some(conn => {
      const [sourcePort, targetPort] = conn.split('→');
      const [expectedSourcePort, expectedTargetPort] = portConnection.split('→');
      
      // Check if port names contain the expected values (case insensitive)
      return (
        sourcePort.toLowerCase().includes(expectedSourcePort.toLowerCase()) &&
        targetPort.toLowerCase().includes(expectedTargetPort.toLowerCase())
      );
    });
    
    if (!matchFound) {
      return false;
    }
  }
  
  // All checks passed, this matches the pattern
  return true;
};

// Detect which pattern the workflow matches
const detectWorkflowPattern = (nodes: NodeData[], edges: EdgeData[]): {patternId: string, endpoint: string} | null => {
  for (const pattern of workflowPatterns) {
    if (checkWorkflowPattern(nodes, edges, pattern.id)) {
      return {
        patternId: pattern.id,
        endpoint: pattern.endpoint
      };
    }
  }
  return null;
};

// Updated handlePlayClick function
const handlePlayClick = async () => {
  if (nodes.length === 0) {
    alert("Nothing to execute. Please add some nodes to your flow.");
    return;
  }

  setIsExecuting(true);
  setExecutionResult(null);
  
  try {
    // Detect workflow pattern
    const detectedPattern = detectWorkflowPattern(nodes, edges);
    
    if (!detectedPattern) {
      throw new Error("Unsupported workflow pattern. Please check your node connections.");
    }
    
    console.log(`${detectedPattern.patternId} pattern detected - calling ${detectedPattern.endpoint}`);
    
    let response;
    let result;
    
    // Format and send request based on the detected pattern
    switch (detectedPattern.patternId) {
      case 'text-agent': {
        // Find required nodes
        const textAgentNode = nodes.find(node => node.type === 'Text-Agent');
        const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
        
        if (!textAgentNode || !textInputNode) {
          throw new Error("Missing required nodes for Text Agent workflow");
        }
        
        // Extract values with proper typing
        const modelInput = textAgentNode.data.inputs.find(input => input.name === 'LLM');
        const instructionsInput = textAgentNode.data.inputs.find(input => input.name === 'Instructions');
        const queryValue = textInputNode.data.inputs.find(input => input.name === 'Text')?.value || '';
        
        // Create properly typed request payload
        const payload: TextAgentRequest = {
          model: modelInput?.value || "gpt-4",
          query: queryValue,
          instructions: instructionsInput?.value || ""
        };
        
        console.log("Sending text agent request:", payload);
        
        // Use the typed request function
        result = await sendJsonRequest<TextAgentRequest>(
          ApiEndpoint.TextAgent,
          payload
        );
        
        console.log('Execution result:', result);
        break;
      }
      
      case 'csv-agent': {
        // Find CSV-Agent and File-Input-Tool nodes
        const csvAgentNode = nodes.find(node => node.type === 'CSV-Agent');
        const fileInputNode = nodes.find(node => node.type === 'File-Input-Tool');
        const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
        
        if (!csvAgentNode || !fileInputNode) {
          throw new Error("Missing required nodes for CSV Agent workflow");
        }
        
        // Extract query from Text-Input-Tool
        const queryValue = textInputNode?.data.inputs.find(input => input.name === 'Text')?.value || '';
        
        // Extract file from File-Input-Tool with added debugging
        const fileInput = fileInputNode.data.inputs.find(input => input.name === 'File');
        const fileValue = fileInput?.value;
        
        console.log("File value:", fileValue);
        console.log("File value type:", fileValue ? typeof fileValue : 'undefined');
        console.log("Is File instance:", fileValue instanceof File);
        
        // Validate if we have an actual File object
        if (!fileValue) {
          throw new Error("No file selected for CSV Agent. Please upload a file.");
        }
        
        if (!(fileValue instanceof File) || fileValue.size === 0) {
          throw new Error("Please select a valid CSV file with content (not just a filename)");
        }
        
        // Use the original file object directly
        result = await sendFormDataRequest<ApiResponse>(
          ApiEndpoint.CsvAgent,
          {
            model: "gemini",
            query: queryValue,
            file: fileValue
          }
        );
        
        console.log('Execution result:', result);
        break;
      }
      
      case 'rag': {
        // Find Text-Agent, Knowledge-Base, and Text-Input-Tool nodes
        const textAgentNode = nodes.find(node => node.type === 'Text-Agent');
        const knowledgeBaseNode = nodes.find(node => node.type === 'Knowledge-Base');
        const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
        
        if (!textAgentNode || !knowledgeBaseNode || !textInputNode) {
          throw new Error("Missing required nodes for RAG workflow");
        }
        
        // Extract query from Text-Input-Tool
        const queryValue = textInputNode.data.inputs.find(input => input.name === 'Text')?.value || '';
        
        // Extract file from Knowledge-Base
        const fileInput = knowledgeBaseNode.data.inputs.find(input => input.name === 'File');
        const fileValue = fileInput?.value;
        
        if (!fileValue) {
          throw new Error("No file selected for Knowledge Base");
        }
        
        const formData = new FormData();
        formData.append("model", "gemini");
        formData.append("query", queryValue);
        formData.append("file", fileValue); // Assuming fileValue is a File object
        
        response = await fetch(detectedPattern.endpoint, {
          method: 'POST',
          body: formData
        });
        break;
      }
      
      case 'web-search': {
        // Find Text-Agent, Web-Search-Tool, and Text-Input-Tool nodes
        const textAgentNode = nodes.find(node => node.type === 'Text-Agent');
        const webSearchNode = nodes.find(node => node.type === 'Web-Search-Tool');
        const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
        
        if (!textAgentNode || !webSearchNode || !textInputNode) {
          throw new Error("Missing required nodes for Web Search workflow");
        }
        
        // Extract query from Text-Input-Tool
        const queryValue = textInputNode.data.inputs.find(input => input.name === 'Text')?.value || '';
        
        // Extract instructions from Text-Agent if available
        const instructionsInput = textAgentNode.data.inputs.find(input => input.name === 'Instructions');
        
        const payload = {
          model: "google_search",
          query: queryValue,
          instructions: instructionsInput?.value || ""
        };
        
        response = await fetch(detectedPattern.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;
      }
      
      case 'marketing-cold-caller': {
        // For voice-agent, the example shows no input required
        response = await fetch(detectedPattern.endpoint, {
          method: 'POST'
        });
        break;
      }
      
      case 'email-marketing': {
        // This would need to be implemented based on email workflow requirements
        // As it's not in the provided examples, we'll use a generic approach
        const payload = {
          nodes: prepareNodeData(),
          edges: edges
        };
        
        response = await fetch(detectedPattern.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        break;
      }
      
      default: {
        // Generic fallback for unhandled patterns
        const payload = {
          nodes: prepareNodeData(),
          edges: edges
        };
        
        response = await fetch(detectedPattern.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    }
    
    // Handle the result based on how it was obtained
    if (response) {
      // For cases that used fetch and set the response variable
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      result = await response.json();
    }
    
    // At this point, result should be set regardless of which approach was used
    console.log('Execution result:', result);
    
    setExecutionResult({
      success: true,
      message: result.message || "Flow executed successfully!"
    });
  } catch (error) {
    console.error('Error executing flow:', error);
    setExecutionResult({
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
    });
  } finally {
    setIsExecuting(false);
  }
};

// Helper function to prepare node data
const prepareNodeData = () => {
  return nodes.map(node => ({
    id: node.id,
    type: node.type,
    data: {
      label: node.data.label,
      inputs: node.data.inputs.map(input => ({
        id: input.id,
        name: input.name,
        type: input.type,
        fieldType: input.fieldType,
        value: input.value || null
      })),
      outputs: node.data.outputs.map(output => ({
        id: output.id,
        name: output.name,
        type: output.type,
        fieldType: output.fieldType
      }))
    }
  }));
};

  // Add a new function to navigate to Templates page
  const handleViewTemplates = () => {
    navigate('/marketplace');
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar onAddNode={handleAddNode} />
      <Workspace 
        nodes={nodes} 
        setNodes={setNodes} 
        edges={edges}
        onAddEdge={handleAddEdge}
        onRemoveEdge={handleRemoveEdge}
        onNodeDrop={handleNodeDrop}
        onSaveTemplate={() => setIsTemplateSaveModalOpen(true)}
        onViewTemplates={handleViewTemplates} // Add this prop
        onPlayClick={handlePlayClick} // Add this prop
        isExecuting={isExecuting} // Add this prop
        executionResult={executionResult} // Add this prop
      />

      {/* Template Save Modal */}
      {isTemplateSaveModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Save as Template</h2>
            <input 
              type="text" 
              placeholder="Template name"
              className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  handleSaveTemplate((e.target as HTMLInputElement).value.trim());
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                onClick={() => setIsTemplateSaveModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                  if (input && input.value.trim()) {
                    handleSaveTemplate(input.value.trim());
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playground;
