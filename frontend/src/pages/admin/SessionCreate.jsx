import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSession } from '../../api';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

export default function SessionCreate() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [blindMode, setBlindMode] = useState(true);
  const [categoryMode, setCategoryMode] = useState('all');
  const [resultsMode, setResultsMode] = useState('per_item');
  const [categories, setCategories] = useState([{ name: 'Gusto', scale: '1-10', weight: 1.0 }]);
  const [items, setItems] = useState([{ public_name: 'Prodotto 1', real_name: '', attributes: [] }]);

  const addCategory = () => setCategories([...categories, { name: '', scale: '1-10', weight: 1.0 }]);
  const updateCategory = (idx, field, val) => {
    const newCat = [...categories];
    newCat[idx][field] = val;
    setCategories(newCat);
  };
  const removeCategory = (idx) => setCategories(categories.filter((_, i) => i !== idx));

  const addItem = () => setItems([...items, { public_name: `Prodotto ${items.length + 1}`, real_name: '', attributes: [] }]);
  const updateItem = (idx, field, val) => {
    const newIt = [...items];
    newIt[idx][field] = val;
    setItems(newIt);
  };
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const addAttribute = (itemIdx) => {
    const newItems = [...items];
    newItems[itemIdx].attributes = [...(newItems[itemIdx].attributes || []), { key: '', value: '' }];
    setItems(newItems);
  };
  const updateAttribute = (itemIdx, attrIdx, field, val) => {
    const newItems = [...items];
    newItems[itemIdx].attributes[attrIdx][field] = val;
    setItems(newItems);
  };
  const removeAttribute = (itemIdx, attrIdx) => {
    const newItems = [...items];
    newItems[itemIdx].attributes = newItems[itemIdx].attributes.filter((_, i) => i !== attrIdx);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const session = await createSession({ name, date, blind_mode: blindMode, category_mode: categoryMode, results_mode: resultsMode, categories, items });
    navigate(`/admin/session/${session.id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-3 bg-white dark:bg-zinc-900 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm border border-zinc-200 dark:border-zinc-800">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold">Create New Session</h1>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('pollnight_token'); window.location.href = '/admin'; }}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-6">General Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">Event Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pizza Tasting 2026" className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
              </div>
              <div className="md:col-span-2 flex items-center gap-3 mt-2">
                <input type="checkbox" id="blind" checked={blindMode} onChange={e => setBlindMode(e.target.checked)} className="w-5 h-5 accent-brand-500" />
                <label htmlFor="blind" className="font-medium cursor-pointer">Blind Test Mode</label>
                <p className="text-sm text-zinc-500">(Real product names hidden from voters until revealed)</p>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">Voting Category Mode</label>
                <select value={categoryMode} onChange={e => setCategoryMode(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="all">All Categories at Once</option>
                  <option value="single">One Category at a Time (Admin Controls Next)</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">Results Display Mode</label>
                <select value={resultsMode} onChange={e => setResultsMode(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="per_item">Show results after each product</option>
                  <option value="end">Show results only at the end of the event</option>
                </select>
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Voting Categories</h2>
              <button type="button" onClick={addCategory} className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 font-medium hover:opacity-80 transition-opacity">
                <Plus size={16} /> Add Category
              </button>
            </div>
            <div className="space-y-4">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1 text-zinc-500">Category Name</label>
                    <input required type="text" value={cat.name} onChange={e => updateCategory(idx, 'name', e.target.value)} placeholder="e.g. Crispiness" className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium mb-1 text-zinc-500">Scale</label>
                    <select value={cat.scale} onChange={e => updateCategory(idx, 'scale', e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="1-5">1 - 5</option>
                      <option value="1-10">1 - 10</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => removeCategory(idx)} className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Items */}
          <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Items to Vote</h2>
              <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 font-medium hover:opacity-80 transition-opacity">
                <Plus size={16} /> Add Item
              </button>
            </div>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-4 items-end mb-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1 text-zinc-500">Public Name {blindMode && '(Alias)'}</label>
                      <input required type="text" value={item.public_name} onChange={e => updateItem(idx, 'public_name', e.target.value)} placeholder="e.g. Item A" className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    {blindMode && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-zinc-500">Real Name / Brand</label>
                        <input required type="text" value={item.real_name} onChange={e => updateItem(idx, 'real_name', e.target.value)} placeholder="e.g. Domino's" className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                    )}
                    <button type="button" onClick={() => removeItem(idx)} className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  {/* Attributes */}
                  <div className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-zinc-500">Custom Attributes (Optional)</label>
                      <button type="button" onClick={() => addAttribute(idx)} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center gap-1">
                        <Plus size={12} /> Add Attribute
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(item.attributes || []).map((attr, attrIdx) => (
                        <div key={attrIdx} className="flex gap-2">
                          <input type="text" value={attr.key} onChange={e => updateAttribute(idx, attrIdx, 'key', e.target.value)} placeholder="e.g. Cost" className="w-1/3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                          <input type="text" value={attr.value} onChange={e => updateAttribute(idx, attrIdx, 'value', e.target.value)} placeholder="e.g. $10" className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                          <button type="button" onClick={() => removeAttribute(idx, attrIdx)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-brand-500/20">
              <Save size={24} />
              Save and Start Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
