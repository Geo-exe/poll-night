import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, ImagePlus, Copy, BookmarkPlus, X, Loader2 } from 'lucide-react';
import { fetchAttributePresets, createAttributePreset, deleteAttributePreset, uploadImage } from '../api';
import { resizeImageFile } from '../utils/image';
import { cleanAttributes } from '../utils/attributes';
import { mediaUrl } from '../utils/media';

const blankCategory = () => ({ name: '', scale: '1-10', weight: 1.0 });

const blankItem = (index) => ({
  public_name: `Prodotto ${index}`,
  real_name: '',
  image_url: '',
  attributes: []
});

const normalizeCategory = (category) => ({
  id: category.id,
  name: category.name || '',
  scale: category.scale || '1-10',
  weight: category.weight ?? 1.0
});

const normalizeAttribute = (attribute) => ({
  key: attribute?.key || '',
  value: attribute?.value || ''
});

const dataUrlSize = (dataUrl) => (
  typeof dataUrl === 'string' && dataUrl.startsWith('data:') ? (dataUrl.length * 3) / 4 : 0
);
const formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const normalizeItem = (item, index) => ({
  id: item.id,
  public_name: item.public_name || `Prodotto ${index + 1}`,
  real_name: item.real_name || '',
  image_url: item.image_url || '',
  attributes: Array.isArray(item.attributes) ? item.attributes.map(normalizeAttribute) : []
});

const mergePresetAttributes = (current, presetAttributes) => {
  const presetKeys = new Set(
    presetAttributes.map(attribute => (attribute.key || '').trim().toLowerCase()).filter(Boolean)
  );
  const untouched = current.filter(attribute => !presetKeys.has((attribute.key || '').trim().toLowerCase()));
  return [...untouched, ...presetAttributes.map(normalizeAttribute)];
};

export default function SessionForm({ initialData, submitLabel = 'Save and Start Event', onSubmit }) {
  const [name, setName] = useState(initialData?.name || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [blindMode, setBlindMode] = useState(
    initialData?.blind_mode === undefined ? true : Boolean(initialData.blind_mode)
  );
  const [categoryMode, setCategoryMode] = useState(initialData?.category_mode || 'all');
  const [resultsMode, setResultsMode] = useState(initialData?.results_mode || 'per_item');
  const [sharedAttributes, setSharedAttributes] = useState(
    (Array.isArray(initialData?.shared_attributes) ? initialData.shared_attributes : []).map(normalizeAttribute)
  );
  const [categories, setCategories] = useState(
    initialData?.categories?.length
      ? initialData.categories.map(normalizeCategory)
      : [{ name: 'Gusto', scale: '1-10', weight: 1.0 }]
  );
  const [items, setItems] = useState(
    initialData?.items?.length
      ? initialData.items.map(normalizeItem)
      : [blankItem(1)]
  );
  const [presets, setPresets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingIndexes, setUploadingIndexes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttributePresets()
      .then(setPresets)
      .catch(() => setPresets([]));
  }, []);

  const updateCategory = (index, field, value) => {
    setCategories(current => current.map((category, i) => (
      i === index ? { ...category, [field]: value } : category
    )));
  };

  const updateItem = (index, field, value) => {
    setItems(current => current.map((item, i) => (
      i === index ? { ...item, [field]: value } : item
    )));
  };

  const updateItemAttributes = (index, updater) => {
    setItems(current => current.map((item, i) => (
      i === index ? { ...item, attributes: updater(item.attributes || []) } : item
    )));
  };

  const addSharedAttribute = () => {
    setSharedAttributes(current => [...current, { key: '', value: '' }]);
  };

  const updateSharedAttribute = (index, field, value) => {
    setSharedAttributes(current => current.map((attribute, i) => (
      i === index ? { ...attribute, [field]: value } : attribute
    )));
  };

  const addItemAttribute = (itemIndex) => {
    updateItemAttributes(itemIndex, attributes => [...attributes, { key: '', value: '' }]);
  };

  const updateItemAttribute = (itemIndex, attributeIndex, field, value) => {
    updateItemAttributes(itemIndex, attributes => attributes.map((attribute, i) => (
      i === attributeIndex ? { ...attribute, [field]: value } : attribute
    )));
  };

  const removeItemAttribute = (itemIndex, attributeIndex) => {
    updateItemAttributes(itemIndex, attributes => attributes.filter((_, i) => i !== attributeIndex));
  };

  const applyPreset = (itemIndex, presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    updateItemAttributes(itemIndex, attributes => mergePresetAttributes(attributes, preset.attributes));
  };

  const applyPresetToShared = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    setSharedAttributes(current => mergePresetAttributes(current, preset.attributes));
  };

  const saveSharedPreset = async () => {
    const attributes = cleanAttributes(sharedAttributes);
    if (attributes.length === 0) {
      setError('Add at least one shared attribute before saving a preset.');
      return;
    }
    const presetName = window.prompt('Preset name', 'Shared attributes');
    if (!presetName) return;
    try {
      const created = await createAttributePreset({ name: presetName, attributes });
      setPresets(current => [created, ...current]);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const savePreset = async (itemIndex) => {
    const attributes = cleanAttributes(items[itemIndex].attributes || []);
    if (attributes.length === 0) {
      setError('Add at least one attribute before saving a preset.');
      return;
    }
    const presetName = window.prompt('Preset name', items[itemIndex].public_name || 'Preset');
    if (!presetName) return;
    try {
      const created = await createAttributePreset({ name: presetName, attributes });
      setPresets(current => [created, ...current]);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const removePreset = async (preset) => {
    if (!confirm(`Delete preset "${preset.name}"?`)) return;
    try {
      await deleteAttributePreset(preset.id);
      setPresets(current => current.filter(p => p.id !== preset.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const copyPreviousAttributes = (itemIndex) => {
    if (itemIndex === 0) return;
    const previous = items[itemIndex - 1];
    updateItemAttributes(itemIndex, () => (previous.attributes || []).map(attribute => ({ ...attribute })));
  };

  const handleImageUpload = async (itemIndex, file) => {
    if (!file) return;
    setError('');
    setUploadingIndexes(current => current.includes(itemIndex) ? current : [...current, itemIndex]);

    try {
      const imageDataUrl = await resizeImageFile(file, { size: 1000, quality: 0.7 });
      updateItem(itemIndex, 'image_url', imageDataUrl);

      const uploadedUrl = await uploadImage(imageDataUrl, 'item');
      setItems(current => current.map((item, i) => (
        i === itemIndex && item.image_url === imageDataUrl
          ? { ...item, image_url: uploadedUrl }
          : item
      )));
    } catch (err) {
      setItems(current => current.map((item, i) => (
        i === itemIndex && item.image_url?.startsWith('data:image')
          ? { ...item, image_url: '' }
          : item
      )));
      setError(`Photo upload failed: ${err.message}`);
    } finally {
      setUploadingIndexes(current => current.filter(i => i !== itemIndex));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (uploadingIndexes.length > 0) {
      setError('Wait for the photo uploads to finish before saving.');
      return;
    }
    if (items.some(item => item.image_url?.startsWith('data:image'))) {
      setError('Some photos are still inline. Remove and re-upload them before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        name,
        date,
        blind_mode: blindMode,
        category_mode: categoryMode,
        results_mode: resultsMode,
        shared_attributes: cleanAttributes(sharedAttributes),
        categories: categories.map((category, index) => ({
          id: category.id,
          name: category.name,
          scale: category.scale,
          weight: category.weight,
          display_order: index
        })),
        items: items.map((item, index) => ({
          id: item.id,
          public_name: item.public_name,
          real_name: item.real_name,
          image_url: item.image_url || null,
          display_order: index,
          attributes: cleanAttributes(item.attributes || [])
        }))
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const photosSize = items.reduce((sum, item) => sum + dataUrlSize(item.image_url), 0);

  return (
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

      {/* Shared attributes */}
      <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold">Shared Attributes</h2>
            <p className="text-sm text-zinc-500 mt-1">Added to every product, on top of each product's own attributes. Great for Brand, Event or Category.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
            {presets.length > 0 && (
              <select
                defaultValue=""
                onChange={e => {
                  if (e.target.value) applyPresetToShared(e.target.value);
                  e.target.value = '';
                }}
                className="text-xs bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="" disabled>Load preset…</option>
                {presets.map(preset => (
                  <option key={preset.id} value={preset.id}>{preset.name}</option>
                ))}
              </select>
            )}
            <button type="button" onClick={saveSharedPreset} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-brand-500 font-medium transition-colors">
              <BookmarkPlus size={16} /> Save as preset
            </button>
            <button type="button" onClick={addSharedAttribute} className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 font-medium hover:opacity-80 transition-opacity">
              <Plus size={16} /> Add Attribute
            </button>
          </div>
        </div>
        {sharedAttributes.length === 0 ? (
          <p className="text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-950/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4">
            No shared attributes yet. They are optional.
          </p>
        ) : (
          <div className="space-y-2">
            {sharedAttributes.map((attribute, index) => (
              <div key={index} className="flex gap-2">
                <input type="text" value={attribute.key} onChange={e => updateSharedAttribute(index, 'key', e.target.value)} placeholder="e.g. Brand" className="w-1/3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <input type="text" value={attribute.value} onChange={e => updateSharedAttribute(index, 'value', e.target.value)} placeholder="e.g. Homemade" className="flex-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <button type="button" onClick={() => setSharedAttributes(current => current.filter((_, i) => i !== index))} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Voting Categories</h2>
          <button type="button" onClick={() => setCategories(current => [...current, blankCategory()])} className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 font-medium hover:opacity-80 transition-opacity">
            <Plus size={16} /> Add Category
          </button>
        </div>
        <div className="space-y-4">
          {categories.map((category, index) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1 text-zinc-500">Category Name</label>
                <input required type="text" value={category.name} onChange={e => updateCategory(index, 'name', e.target.value)} placeholder="e.g. Crispiness" className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium mb-1 text-zinc-500">Scale</label>
                <select value={category.scale} onChange={e => updateCategory(index, 'scale', e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="1-5">1 - 5</option>
                  <option value="1-10">1 - 10</option>
                </select>
              </div>
              <button type="button" onClick={() => setCategories(current => current.filter((_, i) => i !== index))} className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
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
          <button type="button" onClick={() => setItems(current => [...current, blankItem(current.length + 1)])} className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 font-medium hover:opacity-80 transition-opacity">
            <Plus size={16} /> Add Item
          </button>
        </div>

        <div className="mb-6 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <BookmarkPlus size={16} className="text-brand-500" /> Attribute Presets
          </h3>
          <p className="text-sm text-zinc-500 mt-1 mb-3">Reusable attribute sets. Apply one to a product, then tweak the values.</p>
          {presets.length === 0 ? (
            <p className="text-sm text-zinc-500">No presets yet. Add attributes to a product and press "Save as preset".</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {presets.map(preset => (
                <span key={preset.id} className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-3 pr-2 py-1.5 text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{preset.name}</span>
                  <span className="text-zinc-400 text-xs">{preset.attributes.map(a => a.key).filter(Boolean).join(' · ')}</span>
                  <button type="button" onClick={() => removePreset(preset)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors" title="Delete preset">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative shrink-0">
                  <label className="relative w-28 h-28 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand-500 flex items-center justify-center overflow-hidden cursor-pointer transition-colors group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingIndexes.includes(index)}
                      onChange={e => {
                        handleImageUpload(index, e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                    {item.image_url ? (
                      <img src={mediaUrl(item.image_url)} alt={item.public_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-400 group-hover:text-brand-500 transition-colors">
                        <ImagePlus size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Photo</span>
                      </div>
                    )}
                    {uploadingIndexes.includes(index) && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white" size={22} />
                      </div>
                    )}
                  </label>
                  {item.image_url && !uploadingIndexes.includes(index) && (
                    <button type="button" onClick={() => updateItem(index, 'image_url', '')} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors" title="Remove photo">
                      <X size={14} />
                    </button>
                  )}
                  {item.image_url && (
                    <p className="w-28 text-center text-[10px] text-zinc-500 mt-1 tabular-nums">
                      {item.image_url.startsWith('data:') ? formatBytes(dataUrlSize(item.image_url)) : 'Uploaded'}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1 text-zinc-500">Public Name {blindMode && '(Alias)'}</label>
                      <input required type="text" value={item.public_name} onChange={e => updateItem(index, 'public_name', e.target.value)} placeholder="e.g. Costume 1" className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    {blindMode && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-zinc-500">Real Name / Person</label>
                        <input required type="text" value={item.real_name} onChange={e => updateItem(index, 'real_name', e.target.value)} placeholder="e.g. Giulia" className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                    )}
                    <button type="button" onClick={() => setItems(current => current.filter((_, i) => i !== index))} className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" title="Remove item">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              <div className="sm:pl-32 border-l-0 sm:border-l-2 border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <label className="block text-xs font-medium text-zinc-500">Custom Attributes (Optional)</label>
                  {presets.length > 0 && (
                    <select
                      defaultValue=""
                      onChange={e => {
                        if (e.target.value) applyPreset(index, e.target.value);
                        e.target.value = '';
                      }}
                      className="text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="" disabled>Apply preset…</option>
                      {presets.map(preset => (
                        <option key={preset.id} value={preset.id}>{preset.name}</option>
                      ))}
                    </select>
                  )}
                  {index > 0 && (
                    <button type="button" onClick={() => copyPreviousAttributes(index)} className="text-xs text-zinc-500 hover:text-brand-500 font-medium flex items-center gap-1 transition-colors">
                      <Copy size={12} /> Copy previous
                    </button>
                  )}
                  <button type="button" onClick={() => addItemAttribute(index)} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Attribute
                  </button>
                  <button type="button" onClick={() => savePreset(index)} className="text-xs text-zinc-500 hover:text-brand-500 font-medium flex items-center gap-1 transition-colors ml-auto">
                    <BookmarkPlus size={12} /> Save as preset
                  </button>
                </div>
                <div className="space-y-2">
                  {(item.attributes || []).map((attribute, attributeIndex) => (
                    <div key={attributeIndex} className="flex gap-2">
                      <input type="text" value={attribute.key} onChange={e => updateItemAttribute(index, attributeIndex, 'key', e.target.value)} placeholder="e.g. Cost" className="w-1/3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      <input type="text" value={attribute.value} onChange={e => updateItemAttribute(index, attributeIndex, 'value', e.target.value)} placeholder="e.g. $10" className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      <button type="button" onClick={() => removeItemAttribute(index, attributeIndex)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
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

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-5 py-4 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        {photosSize > 0 && (
          <span className={`text-xs font-medium tabular-nums ${photosSize > 100 * 1024 * 1024 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
            Pending photo payload: {formatBytes(photosSize)}
          </span>
        )}
        <button type="submit" disabled={saving || uploadingIndexes.length > 0} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-brand-500/20">
          {uploadingIndexes.length > 0 || saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          {uploadingIndexes.length > 0 ? 'Uploading photos…' : saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
