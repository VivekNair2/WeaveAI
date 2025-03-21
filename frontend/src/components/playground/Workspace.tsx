import React, { useRef, useState, useEffect } from 'react';
import { NodeData, EdgeData, NodeField, DataType } from '../../types/nodeTypes';

interface WorkspaceProps {
  nodes: NodeData[];
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  edges: EdgeData[];
  onAddEdge: (edge: EdgeData) => void;
  onRemoveEdge: (edgeId: string) => void;
  onNodeDrop?: (nodeType: string, position: { x: number, y: number }) => void;
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
  onRemoveEdge,
  onNodeDrop
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
  const [snapFieldId, setSnapFieldId] = useState<string | null>(null);

  useEffect(() => {
    console.log("Edges are:",edges)
  }, [edges])
  
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
    
    // Pass the node type and position to the parent component
    onNodeDrop?.(nodeType, { x, y });
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
    // For inputs, we connect only if a connection is started from an output, and vice versa.
    if ((fieldType === 'input' && connectionStart !== null && connectionStart.type === 'output') ||
        fieldType === 'output') {

      setConnectionStart({
        nodeId,
        fieldId: field.id,
        type: fieldType
      });

      // Local variable to capture the snap candidate in real time
      let currentSnapCandidate: string | null = null;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const workspaceRect = workspaceRef.current?.getBoundingClientRect();
        if (workspaceRect) {
          const mx = moveEvent.clientX - workspaceRect.left;
          const my = moveEvent.clientY - workspaceRect.top;
          setMousePosition({ x: mx, y: my });

          // Determine the candidate field to snap to (within threshold)
          const snapDistance = 40;
          let candidate: string | null = null;
          let minDistance = Infinity;
          Object.entries(fieldPositions).forEach(([fid, pos]) => {
            const dx = pos.x - mx;
            const dy = pos.y - my;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance && distance <= snapDistance) {
              minDistance = distance;
              candidate = fid;
            }
          });
          currentSnapCandidate = candidate;
          setSnapFieldId(candidate);
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        // Capture the candidate from the local variable for connection logic
        const targetFieldIdCandidate = currentSnapCandidate;
        setSnapFieldId(null); // Clear visual snapping feedback

        const workspaceRect = workspaceRef.current?.getBoundingClientRect();
        if (!workspaceRect) return;

        if (targetFieldIdCandidate) {
          const fieldElement = document.querySelector(`[data-field-id="${targetFieldIdCandidate}"]`);
          if (fieldElement) {
            const targetFieldId = fieldElement.getAttribute('data-field-id');
            const targetNodeId = fieldElement.getAttribute('data-node-id');
            const targetFieldType = fieldElement.getAttribute('data-field-type');

            if (targetFieldId && targetNodeId && targetFieldType) {
              const currentConnection = {
                nodeId,
                fieldId: field.id,
                type: fieldType
              };

              const isValidConnection =
                (currentConnection.type === 'output' && targetFieldType === 'input') ||
                (currentConnection.type === 'input' && targetFieldType === 'output');

              if (isValidConnection && targetNodeId !== currentConnection.nodeId) {
                const source = currentConnection.type === 'output' ? currentConnection.nodeId : targetNodeId;
                const sourceHandle = currentConnection.type === 'output' ? currentConnection.fieldId : targetFieldId;
                const target = currentConnection.type === 'output' ? targetNodeId : currentConnection.nodeId;
                const targetHandle = currentConnection.type === 'output' ? targetFieldId : currentConnection.fieldId;

                onAddEdge({
                  id: 'temp-id', // Parent should update the actual edge id
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


  // Helper to render a connection line
  const renderConnectionLine = () => {
    if (!connectionStart) return null;

    const startPosition = fieldPositions[connectionStart.fieldId];
    if (!startPosition) return null;

    const { x: startX, y: startY } = startPosition;
    const { x: mouseX, y: mouseY } = mousePosition;
    const path = `M${startX},${startY} L${mouseX},${mouseY}`;

    return (
      <svg 
        className="absolute inset-0 pointer-events-none z-10" 
        width="100%" 
        height="100%"
      >
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

  // Helper to render edge connections with delete icon
  const renderEdges = () => {
    return (
      <svg
        className="absolute inset-0 z-10"
        width="100%"
        height="100%"
        style={{ pointerEvents: 'none' }}
      >
      <defs>
        <marker
          id="arrow"
          markerWidth="8" 
          markerHeight="8" 
          refX="8" 
          refY="3" 
          orient="auto"
        >
          <path d="M0,0 L0,6 L7,3 z" fill="#666" />
        </marker>
      </defs>
        {edges.map(edge => {
          const sourcePos = fieldPositions[edge.sourceHandle];
          const targetPos = fieldPositions[edge.targetHandle];

          if (!sourcePos || !targetPos) {
            return null;
          }

          // Calculate midpoint coordinates for the delete icon
          const midX = (sourcePos.x + targetPos.x) / 2;
          const midY = (sourcePos.y + targetPos.y) / 2;

          return (
            <g key={edge.id}>
              <line
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke="#666"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#arrow)"
                style={{ pointerEvents: 'none' }}
              />
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveEdge(edge.id);
                }}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
              >
                <circle cx={midX} cy={midY} r="10" fill="white" stroke="#666" strokeWidth="1" />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fill="#666"
                  fontSize="12"
                  fontWeight="bold"
                >
                  x
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
      className="flex-1 h-full relative overflow-hidden bg-gray-100 p-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(25px,1fr))] grid-rows-[repeat(40,minmax(25px,1fr))] opacity-20 pointer-events-none">
        {Array.from({ length: 1600 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-gray-300" />
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
          className="absolute bg-white rounded-lg shadow-xs shadow-black border border-gray-200 w-90 p-4 cursor-move select-none"
          style={{
            left: `${node.position.x}px`,
            top: `${node.position.y}px`,
            userSelect: 'none',
          }}
          onMouseDown={(e) => handleNodeDragStart(e, node.id)}
        >
          {/* Node header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {node.type === 'text-agent' && '💬'}
                {node.type === 'voice-agent' && '🎤'}
                {node.type === 'csv-agent' && '📂'}
              </span>
              <span className="font-semibold text-gray-800 capitalize">{node.data.label}</span>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setNodes(nodes.filter((n) => n.id !== node.id));
                // Remove any edges connected to this node
                edges.forEach((edge) => {
                  if (edge.source === node.id || edge.target === node.id) {
                    onRemoveEdge(edge.id);
                  }
                });
              }}
            >
              ✕
            </button>
          </div>

          {/* Node content */}
          <div className="flex flex-col space-y-4">
            {/* Input fields */}
            {node.data.inputs.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 w-full">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Inputs</h4>
                <div className="flex flex-col gap-2">
                  {node.data.inputs.map((input) => (
                    <div
                      key={input.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full"
                    >
                      {/* Blue dot */}
                      <div
                        className={`w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 ${
                          snapFieldId === input.id ? 'ring-2 ring-blue-400' : ''
                        }`}
                        data-field-id={input.id}
                        data-node-id={node.id}
                        data-field-type="input"
                        onMouseDown={(e) => handleFieldMouseDown(e, node.id, input)}
                      />
                      {/* Label with fixed width */}
                      <label className="text-sm text-gray-700 flex-shrink-0 w-24">
                        {input.name}
                      </label>
                      {/* Render an input field only for supported types */}
                      {input.type === 'string' && !input.options && (
                        <input
                          type="text"
                          className="flex-grow p-1 text-sm border rounded w-full"
                          placeholder="Enter value"
                          value={input.value || ''}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === node.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        inputs: n.data.inputs.map((i) =>
                                          i.id === input.id ? { ...i, value: e.target.value } : i
                                        ),
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                        />
                      )}
                      {input.type === 'file' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                            Browse
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const fileName = e.target.files?.[0]?.name || 'No file selected';
                              setNodes((prev) =>
                                prev.map((n) =>
                                  n.id === node.id
                                    ? {
                                        ...n,
                                        data: {
                                          ...n.data,
                                          inputs: n.data.inputs.map((i) =>
                                            i.id === input.id ? { ...i, value: fileName } : i
                                          ),
                                        },
                                      }
                                    : n
                                )
                              );
                            }}
                          />
                          <span className="text-sm text-gray-500">
                            {input.value || 'No file selected'}
                          </span>
                        </label>
                      )}
                      {input.options && (
                        <select
                          className="flex-grow p-1 text-sm border rounded w-full"
                          value={input.value || ''}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === node.id
                                  ? {
                                      ...n,
                                      data: {
                                        ...n.data,
                                        inputs: n.data.inputs.map((i) =>
                                          i.id === input.id ? { ...i, value: e.target.value } : i
                                        ),
                                      },
                                    }
                                  : n
                              )
                            )
                          }
                        >
                          <option value="">Select an option</option>
                          {input.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                      {/* For inputs with type "none", no input field is rendered */}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output fields */}
            {node.data.outputs.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Outputs</h4>
                <div className="space-y-2">
                  {node.data.outputs.map((output) => (
                    <div key={output.id}>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700 flex-1">{output.name}</label>
                        <div
                          className={`w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 ${
                            snapFieldId === output.id ? 'ring-2 ring-blue-400' : ''
                          }`}
                          data-field-id={output.id}
                          data-node-id={node.id}
                          data-field-type="output"
                          onMouseDown={(e) => handleFieldMouseDown(e, node.id, output)}
                        />
                      </div>
                      {output.display && (
                        <div className="mt-2 p-2 border border-gray-300 rounded text-sm">
                          {output.value || <span className="text-gray-500">No output</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Workspace;