import React, { useRef, useState, useEffect } from 'react';
import { NodeData, EdgeData, NodeField, DataType } from '../../types/nodeTypes';

interface WorkspaceProps {
  nodes: NodeData[];
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  edges: EdgeData[];
  onAddEdge: (edge: EdgeData) => void;
  onRemoveEdge: (edgeId: string) => void;
}

// Helper to get colors based on data types
const getTypeColor = (type: DataType): string => {
  switch (type) {
    case 'string': return 'bg-blue-500';
    case 'number': return 'bg-green-500';
    case 'boolean': return 'bg-yellow-500';
    case 'file': return 'bg-purple-500';
    case 'array': return 'bg-red-500';
    case 'object': return 'bg-gray-500';
    default: return 'bg-blue-500';
  }
};

const Workspace: React.FC<WorkspaceProps> = ({ 
  nodes, 
  setNodes, 
  edges, 
  onAddEdge, 
  onRemoveEdge 
}) => {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const draggingNodeRef = useRef<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string, 
    fieldId: string, 
    type: 'input' | 'output'
  } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [fieldPositions, setFieldPositions] = useState<Record<string, { x: number, y: number }>>({});

  // Update field positions when nodes change
  useEffect(() => {
    const updateFieldPositions = () => {
      const newPositions: Record<string, { x: number, y: number }> = {};
      
      document.querySelectorAll('[data-field-id]').forEach((elem) => {
        const fieldId = elem.getAttribute('data-field-id');
        const rect = elem.getBoundingClientRect();
        const workspaceRect = workspaceRef.current?.getBoundingClientRect();
        
        if (fieldId && workspaceRect) {
          newPositions[fieldId] = {
            x: rect.left + rect.width / 2 - workspaceRect.left,
            y: rect.top + rect.height / 2 - workspaceRect.top
          };
        }
      });
      
      setFieldPositions(newPositions);
    };
    
    updateFieldPositions();
    
    // Set up a mutation observer to detect DOM changes
    const observer = new MutationObserver(updateFieldPositions);
    observer.observe(workspaceRef.current as Node, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
    
    return () => observer.disconnect();
  }, [nodes]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const nodeType = e.dataTransfer.getData('application/reactflow');
    
    if (!nodeType) return;
    
    // Get the position relative to the workspace
    const workspaceRect = workspaceRef.current?.getBoundingClientRect();
    const x = e.clientX - (workspaceRect?.left || 0);
    const y = e.clientY - (workspaceRect?.top || 0);
    
    // This is now handled in the Playground component
    // We're just passing the node type to the parent
    // Let the parent handle adding the node with the correct template
    const found = nodes.find(node => node.type === nodeType);
    if (found) {
      return;
    }
  };

  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    // Prevent text selection while dragging
    e.preventDefault();
    
    // Ignore if we're starting to draw a connection
    if (e.target instanceof Element && 
        (e.target.classList.contains('node-input') || 
         e.target.classList.contains('node-output'))) {
      return;
    }
    
    draggingNodeRef.current = nodeId;
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) return;
    
    const startNodeX = currentNode.position.x;
    const startNodeY = currentNode.position.y;
    
    // Add a temp class to body to prevent text selection
    document.body.classList.add('select-none');
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === nodeId 
            ? { 
                ...node, 
                position: { 
                  x: startNodeX + dx, 
                  y: startNodeY + dy 
                } 
              } 
            : node
        )
      );
    };
    
    const handleMouseUp = () => {
      draggingNodeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('select-none');
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleFieldMouseDown = (e: React.MouseEvent, nodeId: string, field: NodeField) => {
    e.stopPropagation();
    
    const fieldType = field.fieldType;
    // For inputs, we can only connect if it's the target (endpoint of connection)
    // For outputs, we can only connect if it's the source (starting point of connection)
    if ((fieldType === 'input' && connectionStart !== null && connectionStart.type === 'output') ||
        fieldType === 'output') {
      
      setConnectionStart({
        nodeId,
        fieldId: field.id,
        type: fieldType
      });
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const workspaceRect = workspaceRef.current?.getBoundingClientRect();
        if (workspaceRect) {
          setMousePosition({
            x: moveEvent.clientX - workspaceRect.left,
            y: moveEvent.clientY - workspaceRect.top
          });
        }
      };
      
      const handleMouseUp = (upEvent: MouseEvent) => {
        const targetElement = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        
        if (targetElement) {
          // Find the nearest input/output field
          const fieldElement = targetElement.closest('[data-field-id]');
          
          if (fieldElement && connectionStart) {
            const targetFieldId = fieldElement.getAttribute('data-field-id');
            const targetNodeId = fieldElement.getAttribute('data-node-id');
            const targetFieldType = fieldElement.getAttribute('data-field-type');
            
            if (targetFieldId && targetNodeId && targetFieldType) {
              // Make sure we're connecting output -> input
              const isValidConnection = 
                (connectionStart.type === 'output' && targetFieldType === 'input') ||
                (connectionStart.type === 'input' && targetFieldType === 'output');
              
              if (isValidConnection && targetNodeId !== connectionStart.nodeId) {
                // Determine source and target based on which is output and which is input
                const source = connectionStart.type === 'output' ? connectionStart.nodeId : targetNodeId;
                const sourceHandle = connectionStart.type === 'output' ? connectionStart.fieldId : targetFieldId;
                const target = connectionStart.type === 'output' ? targetNodeId : connectionStart.nodeId;
                const targetHandle = connectionStart.type === 'output' ? targetFieldId : connectionStart.fieldId;
                
                onAddEdge({
                  id: 'temp-id', // Will be set in parent
                  source,
                  sourceHandle,
                  target,
                  targetHandle
                });
              }
            }
          }
        }
        
        setConnectionStart(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const renderNodeField = (node: NodeData, field: NodeField) => {
    const isInput = field.fieldType === 'input';
    const typeColor = getTypeColor(field.type);
    
    return (
      <div 
        key={field.id}
        className={`flex ${isInput ? 'flex-row' : 'flex-row-reverse'} items-center my-1`}
      >
        <div
          data-field-id={field.id}
          data-node-id={node.id}
          data-field-type={field.fieldType}
          className={`node-${field.fieldType} w-3 h-3 rounded-full ${typeColor} cursor-crosshair`}
          onMouseDown={(e) => handleFieldMouseDown(e, node.id, field)}
        />
        <div className={`flex-1 px-2 text-sm ${isInput ? 'text-left' : 'text-right'}`}>
          {field.name}
        </div>
        
        {/* Render the appropriate input type for editable fields */}
        {isInput && (
          <div className="ml-2 flex-grow">
            {field.type === 'string' && !field.options && (
              <input 
                type="text" 
                className="w-full p-1 text-sm border rounded"
                placeholder="Text value"
                onChange={(e) => {
                  setNodes(prev => 
                    prev.map(n => 
                      n.id === node.id 
                        ? {
                            ...n,
                            data: {
                              ...n.data,
                              inputs: n.data.inputs.map(input => 
                                input.id === field.id 
                                  ? { ...input, value: e.target.value }
                                  : input
                              )
                            }
                          }
                        : n
                    )
                  );
                }}
              />
            )}
            {field.type === 'number' && (
              <input 
                type="number" 
                className="w-full p-1 text-sm border rounded"
                placeholder="0"
                onChange={(e) => {
                  setNodes(prev => 
                    prev.map(n => 
                      n.id === node.id 
                        ? {
                            ...n,
                            data: {
                              ...n.data,
                              inputs: n.data.inputs.map(input => 
                                input.id === field.id 
                                  ? { ...input, value: parseFloat(e.target.value) }
                                  : input
                              )
                            }
                          }
                        : n
                    )
                  );
                }}
              />
            )}
            {field.type === 'boolean' && (
              <select 
                className="w-full p-1 text-sm border rounded"
                onChange={(e) => {
                  setNodes(prev => 
                    prev.map(n => 
                      n.id === node.id 
                        ? {
                            ...n,
                            data: {
                              ...n.data,
                              inputs: n.data.inputs.map(input => 
                                input.id === field.id 
                                  ? { ...input, value: e.target.value === 'true' }
                                  : input
                              )
                            }
                          }
                        : n
                    )
                  );
                }}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            )}
            {field.type === 'file' && (
              <input 
                type="file" 
                className="w-full p-1 text-sm"
              />
            )}
            {field.options && (
              <select 
                className="w-full p-1 text-sm border rounded"
                onChange={(e) => {
                  setNodes(prev => 
                    prev.map(n => 
                      n.id === node.id 
                        ? {
                            ...n,
                            data: {
                              ...n.data,
                              inputs: n.data.inputs.map(input => 
                                input.id === field.id 
                                  ? { ...input, value: e.target.value }
                                  : input
                              )
                            }
                          }
                        : n
                    )
                  );
                }}
              >
                <option value="">Select an option</option>
                {field.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper to render a connection line
  const renderConnectionLine = () => {
    if (!connectionStart) return null;
    
    const startPosition = fieldPositions[connectionStart.fieldId];
    if (!startPosition) return null;
    
    const path = `M ${startPosition.x} ${startPosition.y} L ${mousePosition.x} ${mousePosition.y}`;
    
    return (
      <svg className="absolute inset-0 pointer-events-none z-10">
        <path
          d={path}
          stroke="#666"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        />
      </svg>
    );
  };

  // Helper to render edge connections
  const renderEdges = () => {
    return (
      <svg className="absolute inset-0 pointer-events-none z-0">
        {edges.map(edge => {
          const sourcePos = fieldPositions[edge.sourceHandle];
          const targetPos = fieldPositions[edge.targetHandle];
          
          if (!sourcePos || !targetPos) return null;
          
          // Create a bezier curve
          const dx = Math.abs(targetPos.x - sourcePos.x);
          const bezierX = dx / 2;
          
          const path = `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + bezierX} ${sourcePos.y}, ${targetPos.x - bezierX} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;
          
          return (
            <g key={edge.id}>
              <path
                d={path}
                stroke="#666"
                strokeWidth="2"
                fill="none"
              />
              {/* Add delete button near the middle of the edge */}
              <g 
                transform={`translate(${(sourcePos.x + targetPos.x) / 2 - 8}, ${(sourcePos.y + targetPos.y) / 2 - 8})`}
                className="cursor-pointer"
                onClick={() => onRemoveEdge(edge.id)}
              >
                <circle 
                  cx="8" 
                  cy="8" 
                  r="8" 
                  fill="white" 
                  stroke="#666"
                />
                <text 
                  x="8" 
                  y="12" 
                  fontSize="12" 
                  textAnchor="middle" 
                  fill="#666"
                >
                  ×
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div 
      ref={workspaceRef}
      className="flex-1 h-full relative overflow-hidden bg-slate-50 p-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(25px,1fr))] grid-rows-[repeat(40,minmax(25px,1fr))] opacity-20 pointer-events-none">
        {Array.from({ length: 1600 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-gray-200" />
        ))}
      </div>
      
      {/* Render connecting line when dragging */}
      {connectionStart && renderConnectionLine()}
      
      {/* Render all edges */}
      {renderEdges()}
      
      {/* Render nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute bg-white rounded-md shadow-md border border-gray-200 w-64 p-3 cursor-move select-none"
          style={{
            left: `${node.position.x}px`,
            top: `${node.position.y}px`,
            userSelect: 'none'
          }}
          onMouseDown={(e) => handleNodeDragStart(e, node.id)}
        >
          {/* Node header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-xl mr-2">
                {node.type === 'input' && '📥'}
                {node.type === 'output' && '📤'}
                {node.type === 'processor' && '⚙️'}
                {node.type === 'transformer' && '🔄'}
                {node.type === 'connector' && '🔌'}
              </span>
              <span className="font-medium">{node.data.label}</span>
            </div>
            <button 
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setNodes(nodes.filter(n => n.id !== node.id));
                // Remove any edges connected to this node
                edges.forEach(edge => {
                  if (edge.source === node.id || edge.target === node.id) {
                    onRemoveEdge(edge.id);
                  }
                });
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Node content with inputs and outputs */}
          <div className="flex flex-col space-y-2">
            {/* Input fields */}
            {node.data.inputs.length > 0 && (
              <div className="bg-gray-50 p-2 rounded">
                {node.data.inputs.map(input => renderNodeField(node, input))}
              </div>
            )}
            
            {/* Output fields */}
            {node.data.outputs.length > 0 && (
              <div className="bg-gray-50 p-2 rounded mt-2">
                {node.data.outputs.map(output => renderNodeField(node, output))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Workspace;