import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/playground/Sidebar';
import Workspace from '../components/playground/Workspace';
import { NodeData, EdgeData } from '../types/nodeTypes';
import { workflowPatterns } from '../utils/workflowPatterns';
import { 
  ApiEndpoint, 
  TextAgentRequest, 
  sendJsonRequest,
  sendFormDataRequest,
  ApiResponse,
  sendWorkflowAgentRequest
} from '../types/apiTypes';
import { BiMessageDetail } from 'react-icons/bi';
import { BsMicFill, BsFileEarmarkText, BsFileEarmark } from 'react-icons/bs';
import { MdEmail, MdTextFields, MdOutlineOutput } from 'react-icons/md';
import { FiPaperclip, FiSearch } from 'react-icons/fi';
import { AiOutlineSound } from 'react-icons/ai';
import { FaDatabase } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

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
    icon: BsFileEarmark 
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
    inputs: [],
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
    icon: BiMessageDetail
  },
  "Zoom-Tool": {   // new Zoom-Tool template
    inputs: [
        { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
        { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output', display: false }
    ],
    icon: AiOutlineSound
},
};

const Playground = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplateSaveModalOpen, setIsTemplateSaveModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  // Loader text state for animated messages while executing
  const loaderMessages = ["Initializing...", "Processing...", "Almost done..."];
  const [currentLoaderText, setCurrentLoaderText] = useState(loaderMessages[0]);
  const navigate = useNavigate();

  // Cycle through loader texts every 2 seconds when executing
  useEffect(() => {
    let interval: number;
    if (isExecuting) {
      let index = 0;
      interval = window.setInterval(() => {
        index = (index + 1) % loaderMessages.length;
        setCurrentLoaderText(loaderMessages[index]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isExecuting]);

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('d2k-templates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error("Error loading templates:", e);
      }
    }
    const templateToLoad = sessionStorage.getItem('template-to-load');
    if (templateToLoad) {
      try {
        const template = JSON.parse(templateToLoad);
        setNodes(template.nodes);
        setEdges(template.edges);
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
        inputs: template.inputs.map(input => ({ ...input, id: `${input.id}-${Date.now()}` })),
        outputs: template.outputs.map(output => ({ ...output, id: `${output.id}-${Date.now()}` }))
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
        inputs: template.inputs.map(input => ({ ...input, id: `${input.id}-${Date.now()}` })),
        outputs: template.outputs.map(output => ({ ...output, id: `${output.id}-${Date.now()}` }))
      }
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
  };

  const handleAddEdge = (edge: EdgeData) => {
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

  // Shows a debug payload in the console each time nodes or edges change
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
            value: input.value || null
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
      console.log("Data to send backend:", JSON.stringify(payload, null, 2));
    }
  }, [edges, nodes]);

  const checkWorkflowPattern = (nodes: NodeData[], edges: EdgeData[], patternId: string): boolean => {
    const pattern = workflowPatterns.find(p => p.id === patternId);
    if (!pattern) return false;
    const nodeTypeMap: Record<string, NodeData[]> = {};
    nodes.forEach(node => {
      if (!nodeTypeMap[node.type]) {
        nodeTypeMap[node.type] = [];
      }
      nodeTypeMap[node.type].push(node);
    });
    for (const type of pattern.requiredNodeTypes) {
      if (!nodeTypeMap[type] || nodeTypeMap[type].length === 0) {
        return false;
      }
    }
    const connections: Record<string, string[]> = {};
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;
      const connection = `${sourceNode.type}→${targetNode.type}`;
      if (!connections[connection]) {
        connections[connection] = [];
      }
      const sourceOutput = sourceNode.data.outputs.find(o => o.id === edge.sourceHandle);
      const targetInput = targetNode.data.inputs.find(i => i.id === edge.targetHandle);
      if (sourceOutput && targetInput) {
        connections[connection].push(`${sourceOutput.name}→${targetInput.name}`);
      }
    });
    for (const { nodeConnection, portConnection } of pattern.connections) {
      if (!connections[nodeConnection]) {
        return false;
      }
      const matchFound = connections[nodeConnection].some(conn => {
        const [sourcePort, targetPort] = conn.split('→');
        const [expectedSourcePort, expectedTargetPort] = portConnection.split('→');
        return (
          sourcePort.toLowerCase().includes(expectedSourcePort.toLowerCase()) &&
          targetPort.toLowerCase().includes(expectedTargetPort.toLowerCase())
        );
      });
      if (!matchFound) {
        return false;
      }
    }
    return true;
  };

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

  // Helper to prepare minimal node data
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

  const handlePlayClick = async () => {
    if (nodes.length === 0) {
      alert("Nothing to execute. Please add some nodes to your flow.");
      return;
    }
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const detectedPattern = detectWorkflowPattern(nodes, edges);
      if (!detectedPattern) {
        throw new Error("Unsupported workflow pattern. Please check your node connections.");
      }
      console.log(`${detectedPattern.patternId} pattern detected - calling ${detectedPattern.endpoint}`);
      let response;
      let result;
      switch (detectedPattern.patternId) {
        case 'text-agent': {
          const textAgentNode = nodes.find(node => node.type === 'Text-Agent');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!textAgentNode || !textInputNode) {
            throw new Error("Missing required nodes for Text Agent workflow");
          }
          const modelInput = textAgentNode.data.inputs.find(input => input.name === 'LLM');
          const instructionsInput = textAgentNode.data.inputs.find(input => input.name === 'Instructions');
          const queryValue = textInputNode.data.inputs.find(input => input.name === 'Text')?.value || '';
          const payload: TextAgentRequest = {
            model: modelInput?.value || "gpt-4",
            query: queryValue,
            instructions: instructionsInput?.value || ""
          };
          console.log("Sending text agent request:", payload);
          result = await sendJsonRequest<TextAgentRequest>(ApiEndpoint.TextAgent, payload);
          console.log('Execution result:', result);
          break;
        }
        case 'csv-agent': {
          const csvAgentNode = nodes.find(node => node.type === 'CSV-Agent');
          const fileInputNode = nodes.find(node => node.type === 'File-Input-Tool');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!csvAgentNode || !fileInputNode) {
            throw new Error("Missing required nodes for CSV Agent workflow");
          }
          const queryValue = textInputNode?.data.inputs.find(input => input.name === 'Text')?.value || '';
          const fileInput = fileInputNode.data.inputs.find(input => input.name === 'File');
          const fileValue = fileInput?.value;
          console.log("File value:", fileValue);
          if (!fileValue) {
            throw new Error("No file selected for CSV Agent. Please upload a file.");
          }
          if (!(fileValue instanceof File) || fileValue.size === 0) {
            throw new Error("Please select a valid CSV file with content (not just a filename)");
          }
          result = await sendFormDataRequest<ApiResponse>(
            ApiEndpoint.CsvAgent,
            { model: "gemini", query: queryValue, file: fileValue }
          );
          console.log('Execution result:', result);
          break;
        }
        case 'rag': {
          const textAgentNode = nodes.find(node => node.type === 'Text-Agent');
          const knowledgeBaseNode = nodes.find(node => node.type === 'Knowledge-Base');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!textAgentNode || !knowledgeBaseNode || !textInputNode) {
            throw new Error("Missing required nodes for RAG workflow");
          }
          const queryValue = textInputNode.data.inputs.find(input => input.name === 'Text')?.value || '';
          const fileInput = knowledgeBaseNode.data.inputs.find(input => input.name === 'File');
          const fileValue = fileInput?.value;
          if (!fileValue) {
            throw new Error("No file selected for Knowledge Base");
          }
          const formData = new FormData();
          formData.append("model", "gemini");
          formData.append("query", queryValue);
          formData.append("file", fileValue);
          response = await fetch(detectedPattern.endpoint, {
            method: 'POST',
            body: formData
          });
          break;
        }
        case 'web-search': {
          const textAgentNode = nodes.find(node => node.type === 'Text-Agent');
          const webSearchNode = nodes.find(node => node.type === 'Web-Search-Tool');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!textAgentNode || !webSearchNode || !textInputNode) {
            throw new Error("Missing required nodes for Web Search workflow");
          }
          const queryValue = textInputNode.data.inputs.find(input => input.name === 'Text')?.value || '';
          const modelInput = textAgentNode.data.inputs.find(input => input.name === 'LLM');
          const instructionsInput = textAgentNode.data.inputs.find(input => input.name === 'Instructions');
          const payload = {
            model: modelInput?.value || "gemini",
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
          response = await fetch(detectedPattern.endpoint, { method: 'POST' });
          break;
        }
        case 'email-marketing': {
          // Extract required nodes
          const emailAgentNode = nodes.find(node => node.type === 'Email-Tool');
          const fileInputNode = nodes.find(node => node.type === 'File-Input-Tool');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!emailAgentNode || !fileInputNode) {
            throw new Error("Missing required nodes for Email Marketing workflow");
          }
          const senderEmail = emailAgentNode.data.inputs.find(input => input.name === 'Sender Mail')?.value || "";
          const senderName = emailAgentNode.data.inputs.find(input => input.name === "Sender's Name")?.value || "";
          const senderPasskey = emailAgentNode.data.inputs.find(input => input.name === 'Passkey')?.value || "";
          
          const fileInput = fileInputNode.data.inputs.find(input => input.name === 'File');
          const csvFile = fileInput?.value;
          if (!csvFile) {
            throw new Error("No file selected for Email Marketing workflow");
          }
          const productDescription = textInputNode?.data.inputs.find(input => input.name === 'Text')?.value || "Default Product Description";
          
          // Prepare parameters for the workflow agent
          const workflowParams = {
            session_id: "marekting_camapign_222",
            sender_email: "darkbeast645@gmail.com",
            sender_name: "Raviraj",
            sender_passkey: "iaes xvos crlr zvlu",
            company_name: "PowerLook", // You can update these defaults as needed
            product_description: productDescription,
            csv_file: "sample_marketing.csv",
            model: "groq"
          };
          
          // Call the new workflow agent endpoint using the helper function
          result = await sendWorkflowAgentRequest(workflowParams);
          break;
        }
        case 'zoom-tool': { // New Zoom Agent workflow pattern branch
          const zoomToolNode = nodes.find(node => node.type === 'Zoom-Tool');
          if (!zoomToolNode) {
            throw new Error("Missing Zoom-Tool node for Zoom Agent workflow");
          }
          const queryValue = zoomToolNode.data.inputs.find(input => input.name === 'Query')?.value || '';
          // Hardcoded parameters for the Zoom Agent API
          const payload = {
            account_id: "pXfzC-OvToyumpB3e5G5zg",
            client_id: "ZhVZkp8xSKuRepA2HCmmg",
            client_secret: "BcQHU2Tt64ud3VkLhwzf2wVX3fUPUVET",
            query: queryValue
          };
          console.log("Sending Zoom agent request:", payload);
          result = await sendJsonRequest(ApiEndpoint.ZoomAgent, payload);
          break;
        }
        default: {
          const payload = { nodes: prepareNodeData(), edges: edges };
          response = await fetch(detectedPattern.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }
      if (response) {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        result = await response.json();
      }
      // Store both a friendly message and full response data for debugging/display.
      setExecutionResult({
        success: true,
        message: result.message || "Flow executed successfully!",
        data: result.response ? result.response : result
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

  const handleViewTemplates = () => {
    navigate('/marketplace');
  };

  return (
    <div className="relative flex h-screen w-full bg-gray-50">
      <Sidebar onAddNode={handleAddNode} />
      <Workspace 
        nodes={nodes} 
        setNodes={setNodes} 
        edges={edges}
        onAddEdge={handleAddEdge}
        onRemoveEdge={handleRemoveEdge}
        onNodeDrop={handleNodeDrop}
        onSaveTemplate={() => setIsTemplateSaveModalOpen(true)}
        onViewTemplates={handleViewTemplates}
        onPlayClick={handlePlayClick}
        isExecuting={isExecuting}
        executionResult={executionResult}
      />

      {/* Loader Overlay */}
      {isExecuting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 z-[9999] animate-fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-indigo-500 border-dashed rounded-full mx-auto animate-spin"></div>
            <p className="mt-4 text-lg font-semibold">{currentLoaderText}</p>
          </div>
        </div>
      )}

      {/* Execution Result Modal */}
      {executionResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/35 z-[10000]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-3xl max-h-[80vh] overflow-y-auto relative animate-slideIn">
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setExecutionResult(null)}>
                ×
            </button>
            <h3 className={`${executionResult.success ? 'text-green-600' : 'text-red-600'} font-bold text-2xl mb-4`}>
              {executionResult.success ? 'Success' : 'Error'}
            </h3>
            <p className="mb-4">{executionResult.message}</p>
            {executionResult.data && (
              <div className="bg-gray-100 p-4 rounded text-sm overflow-y-auto max-h-[60vh]">
                <ReactMarkdown>
                  {executionResult.data}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Save Modal */}
      {isTemplateSaveModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-[10000]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setIsTemplateSaveModalOpen(false)}>
                ×
            </button>
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
