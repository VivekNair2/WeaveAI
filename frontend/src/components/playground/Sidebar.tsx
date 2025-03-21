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
    <div className="relative h-full bg-white shadow-md border-r border-slate-200 font-['Inter']">
      <div className={`h-full bg-white overflow-y-auto select-none transition-all duration-300 ${collapsed ? 'w-0' : 'w-96'}`}>
        {/* Toggle button - positioned in the middle of the sidebar's right edge */}
        <button 
          onClick={toggleSidebar}
          className="absolute top-1/2 -translate-y-1/2 -right-6 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <HiChevronRight className="text-indigo-600" size={24} /> : <HiChevronLeft className="text-indigo-600" size={24} />}
        </button>
        
        <div className={`p-5 ${collapsed ? 'hidden' : 'block'}`}>
          <h2 className="text-xl font-bold mb-6 text-slate-800 tracking-tight">Components</h2>
          
          <div className="space-y-3">
            {Object.entries(nodeTemplates).map(([nodeType, nodeConfig]) => {
              const IconComponent = nodeConfig.icon;
              return (
                <div
                  key={nodeType}
                  draggable
                  onDragStart={(e) => handleDragStart(e, nodeType)}
                  onClick={() => onAddNode(nodeType)}
                  className="flex items-center p-2 bg-slate-50 rounded-lg cursor-move hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 border border-slate-200 select-none group"
                >
                  <span className="text-xl mr-4 p-2 bg-white rounded-md border border-slate-200 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                    <IconComponent size={20} />
                  </span>
                  <span className="text-slate-700 font-medium capitalize tracking-wide group-hover:text-indigo-700">
                    {nodeType.replace(/-/g, ' ')}
                  </span>
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