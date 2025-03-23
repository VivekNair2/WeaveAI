import React, { useRef, useState, useEffect } from "react";
import { NodeData, EdgeData, NodeField, DataType } from "../../types/nodeTypes";
import { FiPlay } from "react-icons/fi"; // Import play icon

interface WorkspaceProps {
  nodes: NodeData[];
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  edges: EdgeData[];
  onAddEdge: (edge: EdgeData) => void;
  onRemoveEdge: (edgeId: string) => void;
  onNodeDrop?: (nodeType: string, position: { x: number; y: number }) => void;
  onSaveTemplate?: () => void;
  onViewTemplates?: () => void; // Add this new prop
  onPlayClick?: () => void;
  isExecuting?: boolean;
  executionResult?: { success: boolean; message: string } | null;
}

const Workspace: React.FC<WorkspaceProps> = ({
  nodes,
  setNodes,
  edges,
  onAddEdge,
  onRemoveEdge,
  onNodeDrop,
  onSaveTemplate,
  onViewTemplates,
  onPlayClick,
  isExecuting = false,
  executionResult = null,
}) => {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const transformContainerRef = useRef<HTMLDivElement>(null);
  const draggingNodeRef = useRef<string | null>(null);
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    fieldId: string;
    type: "input" | "output";
  } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [fieldPositions, setFieldPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [snapFieldId, setSnapFieldId] = useState<string | null>(null);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;

  useEffect(() => {
    console.log("Edges are:", edges);
  }, [edges]);

  // Update field positions when nodes change or when zoom/pan changes
  useEffect(() => {
    const updateFieldPositions = () => {
      const newPositions: Record<string, { x: number; y: number }> = {};

      document.querySelectorAll("[data-field-id]").forEach((elem) => {
        const fieldId = elem.getAttribute("data-field-id");
        const rect = elem.getBoundingClientRect();
        const workspaceRect = workspaceRef.current?.getBoundingClientRect();

        if (fieldId && workspaceRect) {
          // Convert screen coordinates to workspace logical coordinates
          newPositions[fieldId] = {
            x:
              (rect.left + rect.width / 2 - workspaceRect.left) / scale -
              offset.x,
            y:
              (rect.top + rect.height / 2 - workspaceRect.top) / scale -
              offset.y,
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
      attributeFilter: ["style"],
    });

    return () => observer.disconnect();
  }, [nodes, scale, offset]);

  // Modify your useEffect to add a non-passive wheel event listener
  useEffect(() => {
    const currentWorkspaceRef = workspaceRef.current;

    // This non-passive event listener will properly prevent default browser zoom
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      // Calculate zoom delta based on wheel direction
      const delta = e.deltaY > 0 ? -0.1 : 0.1;

      // Calculate new scale with limits
      const newScale = Math.min(Math.max(scale + delta, MIN_ZOOM), MAX_ZOOM);

      // Get cursor position relative to the workspace
      const workspaceRect = currentWorkspaceRef?.getBoundingClientRect();
      if (!workspaceRect) return;

      const mouseX = e.clientX - workspaceRect.left;
      const mouseY = e.clientY - workspaceRect.top;

      // Calculate zoom center point in workspace coordinates
      const zoomCenterX = mouseX / scale - offset.x;
      const zoomCenterY = mouseY / scale - offset.y;

      // Calculate new offset to zoom toward cursor position
      const newOffsetX =
        (-zoomCenterX * (newScale - scale)) / newScale + offset.x;
      const newOffsetY =
        (-zoomCenterY * (newScale - scale)) / newScale + offset.y;

      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    };

    // Add the wheel event listener with passive: false to ensure preventDefault works
    if (currentWorkspaceRef) {
      currentWorkspaceRef.addEventListener("wheel", handleWheelEvent, {
        passive: false,
      });
    }

    return () => {
      if (currentWorkspaceRef) {
        currentWorkspaceRef.removeEventListener("wheel", handleWheelEvent);
      }
    };
  }, [scale, offset]);

  // Keep this empty handler to avoid React warnings, but the actual work is done in the useEffect above
  const handleWheel = (e: React.WheelEvent) => {
    // No need to do anything here, the non-passive event listener handles it
  };

  // Pan handlers
  const handlePanStart = (e: React.MouseEvent) => {
    console.log("MouseDown detected", e.button);

    // Check if we clicked on a node or connection point
    const isClickOnNode = (e.target as Element).closest("[data-node-id]");
    const isClickOnField = (e.target as Element).closest("[data-field-id]");

    // Only start panning on empty areas with left click OR with middle mouse button anywhere
    if (
      e.button === 1 ||
      (e.button === 0 && !isClickOnNode && !isClickOnField)
    ) {
      e.preventDefault();

      setIsPanning(true);
      console.log("Panning set to true");
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = "grabbing";

      const handlePanMoveDocument = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();
        const dx = (moveEvent.clientX - lastMousePos.current.x) / scale;
        const dy = (moveEvent.clientY - lastMousePos.current.y) / scale;

        setOffset((prevOffset) => ({
          x: prevOffset.x + dx,
          y: prevOffset.y + dy,
        }));

        lastMousePos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      };

      const handlePanEndDocument = () => {
        setIsPanning(false);
        document.body.style.cursor = "default";
        document.removeEventListener("mousemove", handlePanMoveDocument);
        document.removeEventListener("mouseup", handlePanEndDocument);
      };

      // Add document-level event listeners for smooth panning
      document.addEventListener("mousemove", handlePanMoveDocument);
      document.addEventListener("mouseup", handlePanEndDocument);
    }
  };

  // Keep these simpler component-level handlers
  const handlePanMove = (e: React.MouseEvent) => {
    // The document-level handler will take care of this
    if (isPanning) {
      e.preventDefault();
    }
  };

  const handlePanEnd = () => {
    // The document-level handler will take care of this
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const nodeType = e.dataTransfer.getData("application/reactflow");

    if (!nodeType) return;

    // Get the position relative to the workspace and adjust for zoom/pan
    const workspaceRect = workspaceRef.current?.getBoundingClientRect();
    if (!workspaceRect) return;

    // Convert screen coordinates to workspace logical coordinates
    const x = (e.clientX - workspaceRect.left) / scale - offset.x;
    const y = (e.clientY - workspaceRect.top) / scale - offset.y;

    // Pass the node type and position to the parent component
    onNodeDrop?.(nodeType, { x, y });
  };

  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    // Prevent text selection while dragging
    e.preventDefault();

    // Ignore if we're starting to draw a connection
    if (
      e.target instanceof Element &&
      (e.target.classList.contains("node-input") ||
        e.target.classList.contains("node-output"))
    ) {
      return;
    }

    // Ignore if we're panning
    if (isPanning) return;

    draggingNodeRef.current = nodeId;

    const startX = e.clientX;
    const startY = e.clientY;

    const currentNode = nodes.find((n) => n.id === nodeId);
    if (!currentNode) return;

    const startNodeX = currentNode.position.x;
    const startNodeY = currentNode.position.y;

    // Add a temp class to body to prevent text selection
    document.body.classList.add("select-none");

    // Get the node element
    const nodeElement = document.querySelector(
      `[data-node-id="${nodeId}"]`
    ) as HTMLElement;
    if (!nodeElement) return;

    // Set a flag to avoid triggering the position update during drag
    let isDragging = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging) return;

      // Calculate delta in screen pixels
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      // Convert to workspace coordinates by dividing by scale
      const dxWorkspace = dx / scale;
      const dyWorkspace = dy / scale;

      // Use transform for smooth animation instead of updating the state on every mouse move
      nodeElement.style.transform = `translate(${dxWorkspace}px, ${dyWorkspace}px)`;
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;

      // Get the final position
      const transform = nodeElement.style.transform;
      const matrix = new DOMMatrix(transform);

      // Reset the transform
      nodeElement.style.transform = "";

      // Now update the state once at the end of the drag
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                position: {
                  x: startNodeX + matrix.m41,
                  y: startNodeY + matrix.m42,
                },
              }
            : node
        )
      );

      draggingNodeRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("select-none");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleFieldMouseDown = (
    e: React.MouseEvent,
    nodeId: string,
    field: NodeField
  ) => {
    e.stopPropagation();

    const fieldType = field.fieldType;
    // For inputs, we connect only if a connection is started from an output, and vice versa.
    if (
      (fieldType === "input" &&
        connectionStart !== null &&
        connectionStart.type === "output") ||
      fieldType === "output"
    ) {
      // Calculate and set initial mouse position from the click event
      const workspaceRect = workspaceRef.current?.getBoundingClientRect();
      if (workspaceRect) {
        // Convert screen coordinates to workspace logical coordinates
        const initialX = (e.clientX - workspaceRect.left) / scale - offset.x;
        const initialY = (e.clientY - workspaceRect.top) / scale - offset.y;
        setMousePosition({ x: initialX, y: initialY });
      }

      setConnectionStart({
        nodeId,
        fieldId: field.id,
        type: fieldType,
      });

      // Local variable to capture the snap candidate in real time
      let currentSnapCandidate: string | null = null;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const workspaceRect = workspaceRef.current?.getBoundingClientRect();
        if (workspaceRect) {
          // Convert screen coordinates to workspace logical coordinates
          const mx =
            (moveEvent.clientX - workspaceRect.left) / scale - offset.x;
          const my = (moveEvent.clientY - workspaceRect.top) / scale - offset.y;
          setMousePosition({ x: mx, y: my });

          // Determine the candidate field to snap to (within threshold)
          const snapDistance = 40 / scale; // Adjust snap distance based on zoom
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
        // Same connection logic as before
        const targetFieldIdCandidate = currentSnapCandidate;
        setSnapFieldId(null);

        if (targetFieldIdCandidate) {
          const fieldElement = document.querySelector(
            `[data-field-id="${targetFieldIdCandidate}"]`
          );
          if (fieldElement) {
            const targetFieldId = fieldElement.getAttribute("data-field-id");
            const targetNodeId = fieldElement.getAttribute("data-node-id");
            const targetFieldType =
              fieldElement.getAttribute("data-field-type");

            if (targetFieldId && targetNodeId && targetFieldType) {
              const currentConnection = {
                nodeId,
                fieldId: field.id,
                type: fieldType,
              };

              const isValidConnection =
                (currentConnection.type === "output" &&
                  targetFieldType === "input") ||
                (currentConnection.type === "input" &&
                  targetFieldType === "output");

              if (
                isValidConnection &&
                targetNodeId !== currentConnection.nodeId
              ) {
                const source =
                  currentConnection.type === "output"
                    ? currentConnection.nodeId
                    : targetNodeId;
                const sourceHandle =
                  currentConnection.type === "output"
                    ? currentConnection.fieldId
                    : targetFieldId;
                const target =
                  currentConnection.type === "output"
                    ? targetNodeId
                    : currentConnection.nodeId;
                const targetHandle =
                  currentConnection.type === "output"
                    ? targetFieldId
                    : currentConnection.fieldId;

                onAddEdge({
                  id: "temp-id",
                  source,
                  sourceHandle,
                  target,
                  targetHandle,
                });
              }
            }
          }
        }
        setConnectionStart(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  // Helper to render a connection line
  const renderConnectionLine = () => {
    if (!connectionStart) return null;

    const startPosition = fieldPositions[connectionStart.fieldId];
    if (!startPosition) return null;

    const { x: startX, y: startY } = startPosition;
    const { x: mouseX, y: mouseY } = mousePosition;

    // Draw path in workspace coordinates
    const path = `M${startX},${startY} L${mouseX},${mouseY}`;

    return (
      <svg
        className="absolute inset-0 pointer-events-none z-10"
        width="1000px"
        height="1000px"
      >
        <path
          d={path}
          stroke="#666"
          strokeWidth={2 / scale} // Adjust stroke width based on zoom
          fill="none"
          strokeDasharray={`${5 / scale},${5 / scale}`} // Adjust dash based on zoom
        />
      </svg>
    );
  };

  // Helper to render edge connections with delete icon
  const renderEdges = () => {
    return (
      <svg
        className="absolute z-10 left-0 top-0"
        width="1000px"
        height="1000px"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="userSpaceOnUse" // Prevents the marker from scaling with the line
          >
            <path d="M0,0 L0,6 L7,3 z" fill="#6366f1" />
          </marker>
        </defs>
        {edges.map((edge) => {
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
                stroke="#6366f1"
                strokeWidth={2 / scale} // Adjust stroke width based on zoom
                strokeDasharray={`${5 / scale},${5 / scale}`} // Adjust dash based on zoom
                markerEnd="url(#arrow)"
                style={{ pointerEvents: "none" }}
              />
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveEdge(edge.id);
                }}
                style={{ cursor: "pointer", pointerEvents: "all" }}
                transform={`translate(${midX}, ${midY}) scale(${1 / scale})`} // Scale the delete button inversely
              >
                <circle
                  cx="0"
                  cy="0"
                  r="10"
                  fill="white"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#f43f5e"
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

  const getZoomPercentage = () => Math.round(scale * 100);

  return (
    <div
      ref={workspaceRef}
      className="flex-1 h-full relative overflow-hidden bg-slate-50 p-4 font-['Inter']"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onWheel={handleWheel}
      onMouseDown={handlePanStart}
      onMouseMove={handlePanMove}
      onMouseUp={handlePanEnd}
      onMouseLeave={handlePanEnd}
      style={{ touchAction: "none" }} // Prevent browser gesture handling
    >
      {/* Play button and execution status */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-3">
        <button
          onClick={onPlayClick}
          disabled={isExecuting}
          className={`flex items-center cursor-pointer justify-center p-2.5 rounded-full shadow-sm transition-colors ${
            isExecuting
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
          title="Execute flow"
        >
          {isExecuting ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <FiPlay className="h-5 w-5" />
          )}
        </button>

        {/* Show execution result message */}
        {executionResult && (
          <div
            className={`px-3 py-2 rounded-md text-sm font-medium shadow-sm ${
              executionResult.success
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {executionResult.message}
          </div>
        )}
      </div>

      {/* Templates buttons - update to include Browse Templates */}
      <div className="absolute top-4 right-4 z-20 flex space-x-2">
        <button
          className="bg-white rounded-md shadow-sm px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"
          onClick={onViewTemplates}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
          Go to Marketplace
        </button>
        <button
          className="bg-white rounded-md shadow-sm px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"
          onClick={onSaveTemplate}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.12a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Save Template
        </button>
      </div>

      {/* Zoom indicator and controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 items-end z-20">
        {/* Zoom percentage indicator */}
        <div className="bg-white px-3 py-2 rounded-md shadow-sm text-sm border border-slate-200 flex items-center">
          {getZoomPercentage()}%
        </div>

        {/* Zoom controls */}
        <div className="flex flex-col bg-white rounded-r-md shadow-sm">
          <button
            className="px-2 py-1 border-b hover:bg-slate-100"
            onClick={() => {
              const newScale = Math.min(scale + 0.1, MAX_ZOOM);
              setScale(newScale);
            }}
          >
            +
          </button>
          <button
            className="px-2 py-1 hover:bg-slate-100"
            onClick={() => {
              const newScale = Math.max(scale - 0.1, MIN_ZOOM);
              setScale(newScale);
            }}
          >
            -
          </button>
        </div>
      </div>

      {/* Transform container */}
      <div
        ref={transformContainerRef}
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
          // Always keep pointer events active even when panning
          pointerEvents: "auto",
        }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(25px,1fr))] grid-rows-[repeat(40,minmax(25px,1fr))] opacity-15 pointer-events-none">
          {Array.from({ length: 1600 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-slate-300" />
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
            className="absolute bg-white rounded-lg shadow-md border border-slate-200 w-100 p-5 cursor-move select-none hover:shadow-lg"
            style={{
              left: `${node.position.x}px`,
              top: `${node.position.y}px`,
              userSelect: "none",
            }}
            onMouseDown={(e) => handleNodeDragStart(e, node.id)}
            data-node-id={node.id}
          >
            {/* Node content remains the same as before */}
            {/* Node header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">
                  {node.type === "text-agent" && "💬"}
                  {node.type === "voice-agent" && "🎤"}
                  {node.type === "csv-agent" && "📂"}
                </span>
                <span className="font-semibold text-slate-800 capitalize tracking-wide">
                  {node.data.label}
                </span>
              </div>
              <button
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100"
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

            {/* Node content - inputs and outputs remain the same */}
            <div className="flex flex-col space-y-5">
              {/* Input fields */}
              {node.data.inputs.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 w-full">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                    Inputs
                  </h4>
                  <div className="flex flex-col gap-3">
                    {node.data.inputs.map((input) => (
                      <div
                        key={input.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full"
                      >
                        {/* Connection dot with animation on hover/active */}
                        <div
                          className={`w-4 h-4 rounded-full bg-indigo-500 flex-shrink-0 transition-all duration-200 hover:scale-110 ${
                            snapFieldId === input.id
                              ? "ring-2 ring-indigo-300 scale-110"
                              : ""
                          }`}
                          data-field-id={input.id}
                          data-node-id={node.id}
                          data-field-type="input"
                          onMouseDown={(e) =>
                            handleFieldMouseDown(e, node.id, input)
                          }
                        />
                        {/* Label with fixed width */}
                        <label className="text-sm font-medium text-slate-700 flex-shrink-0 w-24">
                          {input.name}
                        </label>
                        {/* Render an input field only for supported types */}
                        {input.type === "string" && !input.options && (
                          <div className="flex w-full">
                            <textarea
                              className="flex-grow p-1 text-sm border rounded-l w-full min-h-[38px] max-h-[120px] resize-none outline-none
             scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
                              style={{
                                scrollbarWidth: "thin",
                                height: "auto", // Start with auto height to accommodate initial content
                                minHeight: "38px",
                                overflowY: "hidden", // Hide scrollbar by default
                              }}
                              placeholder="Enter value"
                              value={input.value || ""}
                              onMouseDown={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                // Auto-resize logic
                                e.target.style.height = "38px"; // Reset height to calculate scroll height
                                const newHeight = Math.min(
                                  e.target.scrollHeight,
                                  120
                                );
                                e.target.style.height = `${newHeight}px`;

                                // Only show scrollbar if content exceeds max height
                                e.target.style.overflowY =
                                  newHeight >= 120 ? "auto" : "hidden";

                                setNodes((prev) =>
                                  prev.map((n) =>
                                    n.id === node.id
                                      ? {
                                          ...n,
                                          data: {
                                            ...n.data,
                                            inputs: n.data.inputs.map((i) =>
                                              i.id === input.id
                                                ? {
                                                    ...i,
                                                    value: e.target.value,
                                                  }
                                                : i
                                            ),
                                          },
                                        }
                                      : n
                                  )
                                );
                              }}
                              onFocus={(e) => {
                                // Ensure the height is correct when the textarea gets focus
                                e.target.style.height = "38px";
                                const newHeight = Math.min(
                                  e.target.scrollHeight,
                                  120
                                );
                                e.target.style.height = `${newHeight}px`;

                                // Only show scrollbar if content exceeds max height
                                e.target.style.overflowY =
                                  newHeight >= 120 ? "auto" : "hidden";
                              }}
                            />
                            <button
                              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-600 p-1 border border-l-0 rounded-r flex items-center justify-center"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e: {
                                preventDefault: () => void;
                                currentTarget: any;
                              }) => {
                                e.preventDefault();

                                // Check browser support for SpeechRecognition
                                const SpeechRecognition =
                                  (window as any).SpeechRecognition ||
                                  (window as any).webkitSpeechRecognition;

                                if (!SpeechRecognition) {
                                  alert(
                                    "Speech recognition is not supported in your browser"
                                  );
                                  return;
                                }

                                const recognition = new SpeechRecognition();
                                recognition.lang = "en-US";
                                recognition.interimResults = false;

                                // Show feedback that recording has started
                                const button = e.currentTarget;
                                button.classList.add(
                                  "bg-red-100",
                                  "text-red-600"
                                );
                                button.innerHTML =
                                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.756a49.106 49.106 0 0 1 9.152 1 .75.75 0 0 1-.152 1.485h-1.918l2.474 10.124a.75.75 0 0 1-.375.84A6.723 6.723 0 0 1 18.5 18.75H5.5a6.723 6.723 0 0 1-3.431-.761.75.75 0 0 1-.375-.84L4.168 7.025H2.25a.75.75 0 0 1-.152-1.485 49.105 49.105 0 0 1 9.152-1V3a.75.75 0 0 1 .75-.75Zm4.878 13.997a.75.75 0 0 0 .132-1.5 24.585 24.585 0 0 0-4.257-.4h-1.505a24.592 24.592 0 0 0-4.257.4.75.75 0 0 0 .132 1.5c.49-.086 1.011-.142 1.542-.166h6.67c.532.024 1.052.08 1.542.166Z" clip-rule="evenodd" /></svg>';

                                recognition.onresult = (event: any) => {
                                  const transcript =
                                    event.results[0][0].transcript;

                                  // Update the input value with the transcript
                                  setNodes((prev) =>
                                    prev.map((n) =>
                                      n.id === node.id
                                        ? {
                                            ...n,
                                            data: {
                                              ...n.data,
                                              inputs: n.data.inputs.map((i) =>
                                                i.id === input.id
                                                  ? { ...i, value: transcript }
                                                  : i
                                              ),
                                            },
                                          }
                                        : n
                                    )
                                  );
                                };

                                recognition.onend = () => {
                                  // Reset button appearance when recording ends
                                  button.classList.remove(
                                    "bg-red-100",
                                    "text-red-600"
                                  );
                                  button.innerHTML =
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" /><path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" /></svg>';
                                };

                                recognition.onerror = (event: any) => {
                                  console.error(
                                    "Speech recognition error",
                                    event.error
                                  );
                                  button.classList.remove(
                                    "bg-red-100",
                                    "text-red-600"
                                  );
                                  button.innerHTML =
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" /><path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" /></svg>';
                                };

                                recognition.start();
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {input.type === "file" && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                              Browse
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  const file = e.target.files[0];
                                  // Store the actual File object, not just the filename
                                  setNodes((prev) =>
                                    prev.map((n) =>
                                      n.id === node.id
                                        ? {
                                            ...n,
                                            data: {
                                              ...n.data,
                                              inputs: n.data.inputs.map((i) =>
                                                i.id === input.id
                                                  ? { ...i, value: file }
                                                  : i
                                              ),
                                            },
                                          }
                                        : n
                                    )
                                  );
                                }
                              }}
                            />
                            <span className="text-sm text-gray-500">
                              {input.value instanceof File
                                ? input.value.name
                                : input.value || "No file selected"}
                            </span>
                          </label>
                        )}
                        {input.options && (
                          <select
                            className="flex-grow p-1 text-sm border rounded w-full"
                            value={input.value || ""}
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
                                            i.id === input.id
                                              ? { ...i, value: e.target.value }
                                              : i
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
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                    Outputs
                  </h4>
                  <div className="space-y-3">
                    {node.data.outputs.map((output) => (
                      <div key={output.id}>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-slate-700 flex-1">
                            {output.name}
                          </label>
                          <div
                            className={`w-4 h-4 rounded-full bg-cyan-500 flex-shrink-0 transition-all duration-200 hover:scale-110 ${
                              snapFieldId === output.id
                                ? "ring-2 ring-cyan-300 scale-110"
                                : ""
                            }`}
                            data-field-id={output.id}
                            data-node-id={node.id}
                            data-field-type="output"
                            onMouseDown={(e) =>
                              handleFieldMouseDown(e, node.id, output)
                            }
                          />
                        </div>
                        {output.display && (
                          <div className="mt-2 p-3 border border-slate-300 rounded-md text-sm bg-white">
                            {output.value || (
                              <span className="text-slate-400 italic">
                                No output
                              </span>
                            )}
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
    </div>
  );
};

export default Workspace;
