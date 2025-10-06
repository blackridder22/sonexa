import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = ['All', 'Music', 'SFX', 'Favorites'];

  return (
    <div className="w-64 bg-gray-100 p-4">
      <h2 className="text-lg font-bold mb-4">Library</h2>
      <ul>
        {tabs.map((tab) => (
          <li key={tab} className="mb-2">
            <button
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2 rounded ${activeTab === tab ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>
              {tab}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
