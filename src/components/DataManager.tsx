import React, { useState } from 'react';
import { Database, Plus, Trash2, Table as TableIcon, Search, Download } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  fields: string[];
  data: any[];
}

export default function DataManager() {
  const [collections, setCollections] = useState<Collection[]>([
    { id: '1', name: 'Users', fields: ['id', 'name', 'email'], data: [{ id: 1, name: 'John Doe', email: 'john@example.com' }] },
    { id: '2', name: 'Products', fields: ['id', 'title', 'price'], data: [] },
  ]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>('1');

  const activeCollection = collections.find(c => c.id === activeCollectionId);

  const addCollection = () => {
    const name = prompt('Collection Name:');
    if (name) {
      const newCol: Collection = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        fields: ['id'],
        data: [],
      };
      setCollections([...collections, newCol]);
      setActiveCollectionId(newCol.id);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900 flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Collections</h2>
          <button onClick={addCollection} className="p-1 hover:bg-neutral-800 rounded text-blue-500">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                activeCollectionId === col.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              {col.name}
            </button>
          ))}
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeCollection ? (
          <>
            <header className="h-14 border-b border-neutral-800 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-lg">{activeCollection.name}</h3>
                <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 gap-2">
                  <Search className="w-4 h-4 text-neutral-500" />
                  <input type="text" placeholder="Search data..." className="bg-transparent border-none text-sm focus:outline-none w-48" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold transition-all">
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800">
                    {activeCollection.fields.map(field => (
                      <th key={field} className="text-left py-3 px-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">{field}</th>
                    ))}
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeCollection.data.length > 0 ? (
                    activeCollection.data.map((row, i) => (
                      <tr key={i} className="border-b border-neutral-900 hover:bg-neutral-900/50 transition-colors group">
                        {activeCollection.fields.map(field => (
                          <td key={field} className="py-3 px-4 text-sm text-neutral-300">{row[field]}</td>
                        ))}
                        <td className="py-3 px-4">
                          <button className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={activeCollection.fields.length + 1} className="py-20 text-center text-neutral-600">
                        <Database className="w-12 h-12 mx-auto opacity-10 mb-4" />
                        <p>No data in this collection yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
            <Database className="w-16 h-16 opacity-10 mb-4" />
            <p>Select a collection to view data</p>
          </div>
        )}
      </main>
    </div>
  );
}
