import React, { useState } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface SidebarProps {
  onAddNode: (nodeType: string) => void;
}

// Import the nodeTemplates directly
import { nodeTemplates } from '../../pages/Playground';

const Sidebar: React.FC<SidebarProps> = ({ onAddNode }) => {
  const [collapsed, setCollapsed] = useState(false);

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

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="relative h-full bg-white p-5 shadow-sm">
      <div className={`h-full bg-white overflow-y-auto select-none transition-all duration-300 ${collapsed ? 'w-0' : 'w-96'}`}>
        {/* Toggle button - positioned in the middle of the sidebar's right edge */}
        <button 
          onClick={toggleSidebar}
          className="absolute top-1/2 -translate-y-1/2 -right-6 z-10 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <HiChevronRight size={24} /> : <HiChevronLeft size={24} />}
        </button>
        
        <div className={`p-4 ${collapsed ? 'hidden' : 'block'}`}>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Components</h2>
          
          <div className="space-y-2">
            {Object.entries(nodeTemplates).map(([nodeType, nodeConfig]) => {
              const IconComponent = nodeConfig.icon;
              return (
                <div
                  key={nodeType}
                  draggable
                  onDragStart={(e) => handleDragStart(e, nodeType)}
                  onClick={() => onAddNode(nodeType)}
                  className="flex items-center p-3 bg-gray-50 rounded-md cursor-move hover:bg-gray-100 transition-colors border border-gray-200 select-none"
                >
                  <span className="text-xl mr-3">
                    <IconComponent size={20} />
                  </span>
                  <span className="text-gray-700">{nodeType.replace(/-/g, ' ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;