import { useState } from 'react';
import Sidebar from '../components/playground/Sidebar';
import Workspace from '../components/playground/Workspace';
import { NodeData, EdgeData, DataType } from '../types/nodeTypes';

// Node templates with predefined input/output fields
const nodeTemplates: Record<string, { inputs: any[], outputs: any[] }> = {
  'input': {
    inputs: [],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output' }
    ]
  },
  'output': {
    inputs: [
      { id: 'input-1', name: 'Input', type: 'string', fieldType: 'input' }
    ],
    outputs: []
  },
  'processor': {
    inputs: [
      { id: 'input-1', name: 'Text Input', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'Number Input', type: 'number', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Result', type: 'string', fieldType: 'output' }
    ]
  },
  'transformer': {
    inputs: [
      { id: 'input-1', name: 'Source', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'Options', type: 'string', fieldType: 'input', options: ['Option 1', 'Option 2', 'Option 3'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Transformed', type: 'string', fieldType: 'output' },
      { id: 'output-2', name: 'Metadata', type: 'object', fieldType: 'output' }
    ]
  },
  'connector': {
    inputs: [
      { id: 'input-1', name: 'File', type: 'file', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Data', type: 'array', fieldType: 'output' }
    ]
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

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar onAddNode={handleAddNode} />
      <Workspace 
        nodes={nodes} 
        setNodes={setNodes} 
        edges={edges}
        onAddEdge={handleAddEdge}
        onRemoveEdge={handleRemoveEdge}
      />
    </div>
  );
};

export default Playground;
