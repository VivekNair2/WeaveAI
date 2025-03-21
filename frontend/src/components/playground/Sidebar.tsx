import React from 'react';

interface SidebarProps {
  onAddNode: (nodeType: string) => void;
}

const nodeTypes = [
  { id: 'input', label: 'Input', icon: '📥' },
  { id: 'output', label: 'Output', icon: '📤' },
  { id: 'processor', label: 'Processor', icon: '⚙️' },
  { id: 'transformer', label: 'Transformer', icon: '🔄' },
  { id: 'connector', label: 'Connector', icon: '🔌' },
];

const Sidebar: React.FC<SidebarProps> = ({ onAddNode }) => {
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a ghost drag image
    const dragGhost = document.createElement('div');
    dragGhost.innerHTML = nodeType;
    dragGhost.style.position = 'absolute';
    dragGhost.style.top = '-1000px';
    document.body.appendChild(dragGhost);
    e.dataTransfer.setDragImage(dragGhost, 0, 0);
    
    // Remove ghost element after drag starts
    setTimeout(() => {
      document.body.removeChild(dragGhost);
    }, 0);
  };

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 overflow-y-auto p-4 shadow-sm select-none">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Components</h2>
      
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.id}
            draggable
            onDragStart={(e) => handleDragStart(e, node.id)}
            onClick={() => onAddNode(node.id)}
            className="flex items-center p-3 bg-gray-50 rounded-md cursor-move hover:bg-gray-100 transition-colors border border-gray-200 select-none"
          >
            <span className="text-xl mr-3">{node.icon}</span>
            <span className="text-gray-700">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;