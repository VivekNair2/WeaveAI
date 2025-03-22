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

export const nodeTemplates: Record<string, { inputs: any[], outputs: any[], icon: React.ElementType }> = {
  "Text-Agent": {
    inputs: [
      { id: 'input-1', name: 'Tools', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'Instructions', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: 'LLM', type: 'string', fieldType: 'input' },
      { id: 'input-4', name: 'API Key', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output' },
      { id: 'output-2', name: 'Output', type: 'string', fieldType: 'output' }
    ],
    icon: BiMessageDetail
  },
  "Voice-Agent": {
    inputs: [
      { id: 'input-1', name: 'LLM', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'STT', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: 'TTS', type: 'string', fieldType: 'input' },
      { id: 'input-4', name: 'Language', type: 'string', fieldType: 'input' },
      { id: 'input-5', name: 'Instructions', type: 'string', fieldType: 'input' },
      { id: 'input-6', name: 'To Phone Number', type: 'string', fieldType: 'input' }
    ],
    outputs: [],
    icon: BsMicFill
  },
  "CSV-Agent": {
    inputs: [
      { id: 'input-1', name: 'Input Type', type: 'string', fieldType: 'input', options: ['CSV', 'PDF'] },
      { id: 'input-2', name: 'File', type: 'file', fieldType: 'input' },
      { id: 'input-3', name: 'Instructions', type: 'string', fieldType: 'input' }
    ],
    outputs: [],
    icon: BsFileEarmarkText
  },
  "Email-Tool": {
    inputs: [
      { id: 'input-1', name: 'Sender Mail', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'Passkey', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: "Sender's Name", type: 'string', fieldType: 'input' },
      { id: 'input-4', name: "Receiver's Email", type: 'string', fieldType: 'input' },
      { id: 'input-5', name: "Body", type: 'string', fieldType: 'input' }
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
  "TTS-Component": {
    inputs: [
      { id: 'input-1', name: 'Service', type: 'string', fieldType: 'input', options: ['OpenAI', 'ElevenLabs', 'Deepgram'] },
      { id: 'input-2', name: 'API Key', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: 'Text', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Audio', type: 'string', fieldType: 'output', display: true }
    ],
    icon: AiOutlineSound
  },
  "Knowledge-Base": {
    inputs: [
      { id: 'input-1', name: 'File', type: 'file', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Content', type: 'string', fieldType: 'output', display: true }
    ],
    icon: FaDatabase
  },
  "Web-Search-Agent": {
    inputs: [

    ],
    outputs: [
      { id: 'output-1', name: 'Search Results', type: 'string', fieldType: 'output', display: false }
    ],
    icon: FiSearch
  }
};

const Playground = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);

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
        data: node.data,
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
      />
    </div>
  );
};

export default Playground;
