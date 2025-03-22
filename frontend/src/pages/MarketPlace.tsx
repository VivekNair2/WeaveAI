import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCalendar, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi'; // Add this import for rupee icon

interface MarketPlace {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  createdAt: string;
}

const MarketPlace = () => {
  const [templates, setTemplates] = useState<MarketPlace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load templates from localStorage on component mount
  useEffect(() => {
    setIsLoading(true);
    const savedTemplates = localStorage.getItem('d2k-templates');
    
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates);
        // Sort templates by creation date (newest first)
        parsedTemplates.sort((a: MarketPlace, b: MarketPlace) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTemplates(parsedTemplates);
      } catch (e) {
        console.error("Error loading templates:", e);
      }
    }
    setIsLoading(false);
  }, []);

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle template deletion
  const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      localStorage.setItem('d2k-templates', JSON.stringify(updatedTemplates));
    }
  };

  // Handle template selection to load in workspace
  const handleLoadTemplate = (template: MarketPlace) => {
    // Store the selected template in sessionStorage for the Playground to access
    sessionStorage.setItem('template-to-load', JSON.stringify(template));
    navigate('/playground');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/playground')}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiArrowLeft className="text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">MarketPlace</h1>
            </div>
            
            {/* Search bar */}
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search templates"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Template count */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-700">
                {filteredTemplates.length} {filteredTemplates.length === 1 ? 'Template' : 'Templates'} 
                {searchQuery && ` matching "${searchQuery}"`}
              </h2>
            </div>

            {/* Templates grid */}
            {filteredTemplates.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-10 text-center">
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? `No templates found matching "${searchQuery}"`
                    : "No templates saved yet. Create your first template in the Playground!"}
                </p>
                <button
                  onClick={() => navigate('/playground')}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Go to Playground
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleLoadTemplate(template)}
                    className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    {/* Template preview (simplified visualization of nodes) */}
                    <div className="h-40 bg-indigo-50 p-4 relative overflow-hidden">
                      {/* Premium indicator */}
                      <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1.5 shadow-md z-10 border border-amber-500">
                        <BiRupee className="text-white w-4 h-4" />
                      </div>
                      
                      {template.nodes.map((node, index) => (
                        <div 
                          key={node.id}
                          className="absolute bg-white rounded-md shadow-sm border border-gray-200 w-20 h-12 flex items-center justify-center text-xs font-medium"
                          style={{
                            left: `${(node.position.x % 300) / 3}px`,
                            top: `${(node.position.y % 160) / 3}px`,
                            zIndex: index
                          }}
                        >
                          {node.data.label}
                        </div>
                      ))}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                          {template.name}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteTemplate(template.id, e)}
                          className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <FiCalendar size={14} className="mr-1" />
                        <span>
                          {new Date(template.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {template.nodes.length} node{template.nodes.length !== 1 ? 's' : ''} • 
                        {template.edges.length} connection{template.edges.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MarketPlace;