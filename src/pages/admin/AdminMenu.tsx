import React, { useState, useEffect, useRef } from 'react';
import { 
  getMenuItems, 
  getMenuCategories, 
  updateMenuItemInStorage, 
  deleteMenuItemInStorage, 
  addMenuItemInStorage,
  addMenuCategoryInStorage,
  updateMenuCategoryInStorage,
  deleteMenuCategoryInStorage
} from '../../api/client';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle, 
  ChefHat, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  FolderOpen,
  Upload,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface MenuItem {
  id: number;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  spicy: boolean;
  prepTime: string;
  image: string;
  day?: string;
  rating?: number;
}

interface Category {
  id: string;
  name: string;
}

export function AdminMenu() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'preview'>('records');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Add/Edit Meal Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Fields state for Meal
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [day, setDay] = useState('Monday');
  const [price, setPrice] = useState('199');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('15 min');
  const [spicy, setSpicy] = useState(false);
  const [image, setImage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 480; // Optimized thumbnail width
        const scale = MAX_WIDTH / img.width;
        let width = img.width;
        let height = img.height;

        if (img.width > MAX_WIDTH) {
          width = MAX_WIDTH;
          height = img.height * scale;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.7); // 70% quality jpeg
          setImage(compressed);
          toast.success("Image uploaded & compressed efficiently!");
        } else {
          setImage(e.target?.result as string);
          toast.success("Image uploaded!");
        }
      };
      img.onerror = () => {
        toast.error("Failed to load image scaling element.");
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      toast.error("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // Category Management Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Custom delete confirmation modal states
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<Category | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const catsData = await getMenuCategories();
      const categoryOrder = ['breakfast', 'lunch', 'snacks'];
      const sortedCats = [...catsData].sort((a, b) => {
        const idxA = categoryOrder.indexOf(a.id.toLowerCase());
        const idxB = categoryOrder.indexOf(b.id.toLowerCase());
        const scoreA = idxA === -1 ? 99 : idxA;
        const scoreB = idxB === -1 ? 99 : idxB;
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
        return a.name.localeCompare(b.name);
      });
      setCategories(sortedCats);
      
      const itemsData = await getMenuItems();
      setItems(itemsData);
      
      if (sortedCats.length > 0 && !categoryId) {
        setCategoryId(sortedCats[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load menu details.');
      setLoading(false);
    }
  };

  // Sync with React-Query cache to update customer-facing pages instantly
  const refreshMainQueries = () => {
    try {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (e) {
      console.warn("React Query client context mismatch", e);
    }
  };

  // Removed default reset menu handler

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategoryId(categories[0]?.id || 'breakfast');
    setDay('Monday');
    setPrice('199');
    setDescription('');
    setPrepTime('15 min');
    setSpicy(false);
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategoryId(item.categoryId);
    setDay(item.day || 'Monday');
    setPrice(item.price.toString());
    setDescription(item.description);
    setPrepTime(item.prepTime);
    setSpicy(item.spicy);
    setImage(item.image);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      name,
      categoryId,
      day,
      price: Number(price) || 0,
      description,
      prepTime,
      spicy,
      image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
      rating: 4.8
    };

    try {
      if (editingItem) {
        const updatedObj = { ...editingItem, ...payload };
        await updateMenuItemInStorage(updatedObj);
        toast.success("Canteen meal updated!");
      } else {
        await addMenuItemInStorage(payload);
        toast.success("New Canteen meal added successfully!");
      }
      setIsFormOpen(false);
      refreshMainQueries();
      const updated = await getMenuItems();
      setItems(updated);
    } catch (err) {
      console.error(err);
      toast.error("Failed to commit menu database change.");
    }
  };

  // --- Dynamic Category Actions ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategoryName.trim();
    if (!cleanName) return;

    // Generate unique slug id
    const newId = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check duplication
    if (categories.some(c => c.id === newId)) {
      toast.error("A category with a similar slug title already exists.");
      return;
    }

    try {
      const newCatObj = { id: newId, name: cleanName };
      await addMenuCategoryInStorage(newCatObj);
      toast.success(`Category "${cleanName}" added dynamically.`);
      setNewCategoryName('');
      refreshMainQueries();
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create category schema.");
    }
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditingCategoryName(cat.name);
  };

  const handleSaveCategory = async (catId: string) => {
    const cleanName = editingCategoryName.trim();
    if (!cleanName) return;

    try {
      await updateMenuCategoryInStorage({ id: catId, name: cleanName });
      toast.success("Category tag renamed successfully.");
      setEditingCategory(null);
      refreshMainQueries();
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update category.");
    }
  };

  const handleDeleteCategory = (categoryObj: Category) => {
    setDeleteCategoryConfirm(categoryObj);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1); // reset pagination on filters
  };

  const handleCategoryFilterChange = (val: string) => {
    setFilterCategory(val);
    setCurrentPage(1); // reset pagination on filters
  };

  // Combined filters & Sorting sequentially by day of the week, and within each day by Category sequence (breakfast, lunch, snacks)
  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.categoryId === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayA = (a.day || 'Monday').toLowerCase();
      const dayB = (b.day || 'Monday').toLowerCase();
      const idxA = days.indexOf(dayA);
      const idxB = days.indexOf(dayB);
      const scoreA = idxA === -1 ? 99 : idxA;
      const scoreB = idxB === -1 ? 99 : idxB;
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      
      const categoryOrder = ['breakfast', 'lunch', 'snacks'];
      const catA = (a.categoryId || '').toLowerCase();
      const catB = (b.categoryId || '').toLowerCase();
      const catIdxA = categoryOrder.indexOf(catA);
      const catIdxB = categoryOrder.indexOf(catB);
      const catScoreA = catIdxA === -1 ? 99 : catIdxA;
      const catScoreB = catIdxB === -1 ? 99 : catIdxB;
      
      if (catScoreA !== catScoreB) {
        return catScoreA - catScoreB;
      }
      
      return a.name.localeCompare(b.name);
    });

  // Paginated List calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <div className="text-white p-8">Loading Canteen Menu...</div>;

  return (
    <div className="space-y-8">
      {/* Upper header section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div>
          <h3 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-gold-500" />
            Canteen Meal Configuration
          </h3>
          <p className="text-gray-400 text-sm">Create meals, configure pricing, and manage category groups dynamically.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          {/* Manage Categories CTA */}
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-medium px-4 py-3 rounded-xl transition-all cursor-pointer active:scale-95 text-sm"
          >
            <FolderOpen className="w-4 h-4 text-gold-400" />
            <span>Manage Categories</span>
          </button>
          {/* Add New Meal CTA */}
          <button 
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all shadow-lg hover:shadow-gold-500/20 active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5 animate-pulse" />
            <span>Add New Meal</span>
          </button>
        </div>
      </div>

      {/* Mode Select Tabs */}
      <div className="flex border-b border-white/10 gap-6 mt-2 pb-1">
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-3.5 text-sm uppercase font-bold tracking-wider relative flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'records' ? 'text-gold-500 font-extrabold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Manage Menu Database</span>
          {activeTab === 'records' && <span className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] bg-gold-400 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-3.5 text-sm uppercase font-bold tracking-wider relative flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'preview' ? 'text-emerald-400 font-extrabold' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Interactive Weekly Menu Preview</span>
          {activeTab === 'preview' && <span className="absolute bottom-[-1px] left-0 right-0 h-[2.5px] bg-emerald-400 rounded-full" />}
        </button>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* Filter and Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search meals..." 
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-gold-500/50 transition-colors text-sm"
          />
        </div>
        <div>
          <select 
            value={filterCategory} 
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500/50 transition-colors text-sm cursor-pointer"
          >
            <option value="all">All Food & Beverage Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-gray-400 font-mono">
          <span>Match Count:</span>
          <span className="text-gold-500 font-bold text-sm">{filteredItems.length} listed</span>
        </div>
      </div>

      {/* Meals Table with Pagination */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <div className="w-full overflow-x-auto"><table className="w-full text-left text-sm text-gray-200">
            <thead className="bg-white/5 text-xs font-bold uppercase text-white border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Dish Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(item => {
                const categoryObj = categories.find(c => c.id === item.categoryId);
                return (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-white/10 shadow-inner">
                          <img 
                            src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&q=80"} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium text-base">{item.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1 max-w-sm mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="bg-white/5 text-gray-300 font-mono text-xs px-2.5 py-1 rounded-md border border-white/5 capitalize">
                        {categoryObj ? categoryObj.name : item.categoryId.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <span className="text-gold-500 font-bold">⏱</span> {item.prepTime}
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono text-[10px]">
                        <span>📅</span> {item.day || "Monday"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.spicy ? (
                          <span className="text-red-400 uppercase tracking-widest text-[9px] bg-red-400/10 px-1.5 py-0.5 rounded font-mono font-bold">🔥 Spicy</span>
                        ) : (
                          <span className="text-blue-400 uppercase tracking-widest text-[9px] bg-blue-400/10 px-1.5 py-0.5 rounded font-mono">Mild</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 bg-white/5 hover:bg-gold-500 hover:text-slate-950 transition-all rounded-lg text-gray-300 cursor-pointer"
                          title="Edit properties"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-white/5 hover:bg-red-500 hover:text-white transition-all rounded-lg text-gray-300 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-500">
                    <AlertTriangle className="w-10 h-10 text-yellow-500/55 mx-auto mb-3" />
                     No culinary meals match your filter. Try adjusting query terms.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>

        {/* Mobile Card-Based List View */}
        <div className="block md:hidden divide-y divide-white/10">
          {paginatedItems.map(item => {
            const categoryObj = categories.find(c => c.id === item.categoryId);
            return (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-white/10 shadow-inner">
                    <img 
                      src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&q=80"} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-white text-base leading-tight break-words">{item.name}</h4>
                      <span className="bg-white/5 text-gray-300 font-mono text-[10px] px-2 py-0.5 rounded border border-white/10 capitalize shrink-0 ml-1">
                        {categoryObj ? categoryObj.name : item.categoryId.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-gold-500">⏱</span>
                    <span>{item.prepTime}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                    <span>📅</span>
                    <span>{item.day || "Monday"}</span>
                  </div>
                  <div>
                    {item.spicy ? (
                      <span className="text-red-400 uppercase tracking-widest text-[8px] bg-red-400/10 px-1.5 py-0.5 rounded font-mono font-bold">🔥 Spicy</span>
                    ) : (
                      <span className="text-blue-400 uppercase tracking-widest text-[8px] bg-blue-400/10 px-1.5 py-0.5 rounded font-mono font-medium">Mild</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-gold-500 hover:text-slate-950 transition-all rounded-lg text-gray-300 flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-red-500 hover:text-white transition-all rounded-lg text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
          {paginatedItems.length === 0 && (
            <div className="text-center py-12 text-slate-500 px-4">
              <AlertTriangle className="w-10 h-10 text-yellow-500/55 mx-auto mb-3" />
              No culinary meals match your filter.
            </div>
          )}
        </div>

        {/* Dynamic Pagination Footer bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing <span className="text-white font-bold">{startIndex + 1}</span> to <span className="text-white font-bold">{Math.min(startIndex + itemsPerPage, filteredItems.length)}</span> of <span className="font-mono text-gold-500 font-bold">{filteredItems.length}</span> meals
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/5 hover:text-white text-gray-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentPage === i + 1 
                      ? 'bg-gold-500 text-slate-950 font-bold border border-gold-500' 
                      : 'hover:bg-white/5 text-gray-400 border border-transparent'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/5 hover:text-white text-gray-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#020211] border border-emerald-500/20 rounded-2xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
          <span className="text-emerald-400 animate-pulse">●</span> Real-time Interactive Weekly Menu Preview
        </h4>
        <p className="text-xs text-gray-400 leading-relaxed">
          This panel replicates the exact card responsiveness, meal slots, and gorgeous imagery styled on parent/teacher portals.
          Whenever records are customized, updates render here in real-time. <strong>Click any meal card directly to open its edit dialog box.</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto pb-12">
        {[
          { day: "Monday", theme: "Energetic Boost", badge: "High Fiber & Digestible Carbs", badgeBg: "bg-blue-500/10 text-blue-400 border border-blue-500/20", tagline: "Start the week with sustained slow-release energy" },
          { day: "Tuesday", theme: "Protein Builders", badge: "Calcium-Packed Lunch Selection", badgeBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", tagline: "Essential muscle-building organic paneer proteins" },
          { day: "Wednesday", theme: "Iron Vitality", badge: "High-Iron Pediatric Selection", badgeBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20", tagline: "Finger millet ragi iron & pediatric immune support" },
          { day: "Thursday", theme: "Whole Grain Harmony", badge: "B-Complex & Trace Minerals", badgeBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20", tagline: "Folic acid and wholesome ancient elements" },
          { day: "Friday", theme: "Smart Brain Day", badge: "Omega-3 Brain Booster Day", badgeBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20", tagline: "Healthy Omega-3 fats to fuel intellectual focus" },
          { day: "Saturday", theme: "Weekend Delight", badge: "Light Comfort Foods", badgeBg: "bg-teal-500/10 text-teal-400 border border-teal-500/20", tagline: "Lighter digestion comfort and premium weekend favorites to wrap up the week" },
        ].map((dayItem, idx) => {
          // Find meals for this day
          const dayMeals = ["Breakfast", "Lunch", "Snacks"].map(type => {
            const matched = items.find(it => 
              it.day?.toLowerCase() === dayItem.day.toLowerCase() &&
              it.categoryId?.toLowerCase() === type.toLowerCase()
            );
            return {
              type,
              title: matched ? matched.name : `${type} Option (Default)`,
              image: matched ? matched.image : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&q=80",
              price: matched ? matched.price : 60,
              matchedRecord: matched
            };
          });

          return (
            <div key={idx} className="rounded-3xl pt-12 pb-6 px-5 relative flex flex-col justify-between h-full bg-gradient-to-b from-slate-900/90 via-[#0a0c10]/95 to-[#020211]/98 border border-white/10 shadow-lg relative group/card">
              {/* Floating Day Ribbon */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[80%] flex justify-center z-10 font-sans">
                <span className="w-full text-center text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-lg bg-gradient-to-r from-slate-800 to-slate-900 text-slate-400 border border-white/5">
                  {dayItem.day}
                </span>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-slate-900 border-r border-b border-white/5"></div>
              </div>

              <div>
                <div className="flex justify-between items-start gap-2 mb-3 mt-2">
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
                    {dayItem.theme}
                  </h3>
                </div>

                <div className="mb-4">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${dayItem.badgeBg}`}>
                    {dayItem.badge}
                  </span>
                </div>

                <p className="text-white/60 text-xs mb-5 font-semibold leading-relaxed">
                  {dayItem.tagline}
                </p>

                {/* Compact Daily Menu Items Strip List */}
                <div className="mt-4 space-y-2.5">
                  <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono">Daily Menu Dishes:</div>
                  <div className="space-y-2">
                    {dayMeals.map((meal, mIdx) => (
                      <div 
                        key={mIdx} 
                        className="flex items-center justify-between p-2 rounded-xl border border-white/10 bg-slate-900/60 shadow-sm hover:border-gold-500/40 hover:bg-white/5 transition-all group/meal cursor-pointer select-none"
                        onClick={() => {
                          if (meal.matchedRecord) {
                            handleOpenEdit(meal.matchedRecord);
                          } else {
                            // Open add new meal container with populated details
                            setEditingItem(null);
                            setName('');
                            setCategoryId(meal.type.toLowerCase());
                            setDay(dayItem.day);
                            setPrice('150');
                            setDescription('');
                            setPrepTime('15 min');
                            setSpicy(false);
                            setImage(meal.image);
                            setIsFormOpen(true);
                          }
                        }}
                        title={`Click to configure this ${meal.type} meal item`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Gourmet Food Snippet Image */}
                          <div className="w-11 h-11 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-white/10 shadow-inner group-hover/meal:border-gold-500/40 transition-all">
                            <img 
                              src={meal.image} 
                              alt={meal.title} 
                              className="w-full h-full object-cover group-hover/meal:scale-110 transition-transform duration-500" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 mb-1 inline-block bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              {meal.type}
                            </span>
                            <h4 className="text-[11px] font-extrabold text-white whitespace-normal break-words leading-tight group-hover/meal:text-gold-400 transition-colors">{meal.title}</h4>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-gray-400 shrink-0 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 group-hover/meal:text-gold-400 group-hover/meal:border-gold-500/30 transition-colors">
                          ₹{meal.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

      {/* DYNAMIC CATEGORY MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center bg-white/5 px-6 py-4 border-b border-white/10">
              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold-500" />
                Category Configuration
              </h4>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List and Actions scroll area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              <p className="text-xs text-gray-400">
                Configure global category groups. Renaming category tags changes user lists, while deleting deletes assigned meals.
              </p>

              {/* Add category inline bar */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New Category, e.g. Desserts"
                  className="flex-grow bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold-500/50"
                  required
                />
                <button
                  type="submit"
                  className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add List
                </button>
              </form>

              {/* Existing Categories List */}
              <div className="space-y-2">
                <h5 className="text-xs uppercase tracking-wider text-gray-500 font-bold">Category Registries</h5>
                <div className="divide-y divide-white/5 border border-white/5 rounded-xl bg-slate-950 overflow-hidden">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-3.5 flex items-center justify-between group">
                      {editingCategory?.id === cat.id ? (
                        <div className="flex items-center gap-2 w-full max-w-md">
                          <input 
                            type="text" 
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="bg-slate-900 border border-gold-500/40 rounded px-2.5 py-1 text-sm text-white outline-none focus:border-gold-500 w-full"
                          />
                          <button
                            onClick={() => handleSaveCategory(cat.id)}
                            className="text-xs bg-emerald-500 text-white font-bold px-3 py-1.5 rounded cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="text-xs bg-white/5 hover:bg-white/5 text-gray-400 px-3 py-1.5 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="text-sm font-semibold text-white">{cat.name}</span>
                            <span className="text-[10px] font-mono text-gray-500 block">ID Slug: {cat.id}</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={() => handleStartEditCategory(cat)}
                              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-gold-500 rounded transition-colors cursor-pointer"
                              title="Rename Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="bg-white/5 hover:bg-white/5 text-gray-300 font-bold px-5 py-2 rounded-xl text-sm transition-all cursor-pointer"
              >
                Close Control Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT/ADD MEAL WINDOW DIALOG */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center bg-white/5 px-6 py-4 border-b border-white/10 shrink-0">
              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-500" />
                {editingItem ? "Edit Canteen meal" : "Create new Canteen meal"}
              </h4>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Meal Title *</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Canteen Malai Tikka"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Menu Category</label>
                  <select 
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/50 text-sm cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Serving Day *</label>
                  <select 
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/50 text-sm cursor-pointer"
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Estimated Prep Time</label>
                  <input 
                    type="text" 
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="15 min"
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/50 text-sm"
                  />
                </div>
              </div>

              {/* Meal Image Configuration */}
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-widest text-gray-400 font-bold">Meal Image Asset</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] text-gray-500 mb-1">Image URL Link</span>
                    <input 
                      type="text" 
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Paste high-quality photo URL (e.g., Unsplash)"
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2 text-white outline-none focus:border-gold-500/50 text-xs"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-300 font-mono flex items-center justify-center gap-1.5 cursor-pointer hover:border-gold-500/30 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 text-gold-500 animate-pulse" />
                      Upload File
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Drag and Drop Container and Image Preview side-by-side */}
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className={`border border-dashed p-4 rounded-xl flex items-center gap-4 transition-all ${
                    isDragging 
                      ? "border-gold-500 bg-gold-500/5" 
                      : "border-white/10 bg-slate-950/30 hover:border-white/20"
                  }`}
                >
                  <div className="w-16 h-16 rounded-lg bg-slate-950 overflow-hidden border border-white/15 shrink-0 flex items-center justify-center">
                    {image ? (
                      <img src={image} alt="Meal Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-white leading-tight">Drag and drop file here</p>
                    <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">Compressed automatically for fast performance. You can also paste an Unsplash URL above.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-bold">Flavour Description *</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe the spice levels, ingredients and texture served to consumers..."
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3.5 py-2.5 text-white outline-none focus:border-gold-500/50 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/5">
                <div>
                  <span className="block text-xs uppercase tracking-widest text-gray-400 font-bold">Spicy Level</span>
                  <span className="text-[11px] text-gray-500">Enable if dish contains excessive peppers, chilis or spices</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSpicy(!spicy)}
                  className="text-gold-500 hover:text-gold-400 transition-colors"
                >
                  {spicy ? (
                    <div className="flex items-center gap-1">
                      <ToggleRight className="w-9 h-9 text-red-500" />
                      <span className="text-xs font-bold text-red-400 uppercase">Spicy</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <ToggleLeft className="w-9 h-9 text-gray-400" />
                      <span className="text-xs font-bold text-gray-400 uppercase font-mono">Mild</span>
                    </div>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="border border-white/10 px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-emerald text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-emerald-400 hover:text-slate-900 hover:shadow-lg hover:shadow-brand-emerald/20 transition-all uppercase tracking-wide cursor-pointer"
                >
                  {editingItem ? "Update Meal Details" : "Publish to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE STATE-BASED DELETION CONFIRMATION DIALOG FOR MEALS */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500 border-b border-white/10 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-500" />
              <h4 className="text-lg font-serif text-white font-medium">Remove Culinary Meal</h4>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Are you sure you want to remove this exclusive menu item? This action is immediate and will withdraw the choice from consumer selection.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="bg-white/5 hover:bg-white/5 border border-white/10 text-gray-300 font-medium px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const idToDel = deleteConfirmId;
                  setDeleteConfirmId(null);
                  try {
                    await deleteMenuItemInStorage(idToDel);
                    toast.success("Meal removed successfully.");
                    refreshMainQueries();
                    const updated = await getMenuItems();
                    setItems(updated);
                    const totalPages = Math.ceil(updated.length / itemsPerPage);
                    if (currentPage > totalPages && totalPages > 0) {
                      setCurrentPage(totalPages);
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to delete this item.");
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-red-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REUSABLE STATE-BASED DELETION CONFIRMATION DIALOG FOR CATEGORIES */}
      {deleteCategoryConfirm !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500 border-b border-white/10 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-500" />
              <h4 className="text-lg font-serif text-white font-medium">Purge Menu Category</h4>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              WARNING: Are you sure you want to delete <strong className="text-white">"{deleteCategoryConfirm.name}"</strong>? This will also instantly purge ALL Canteen meals assigned to this category! This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteCategoryConfirm(null)}
                className="bg-white/5 hover:bg-white/5 border border-white/10 text-gray-300 font-medium px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const catToDel = deleteCategoryConfirm;
                  setDeleteCategoryConfirm(null);
                  try {
                    await deleteMenuCategoryInStorage(catToDel.id);
                    toast.success(`Category "${catToDel.name}" and its dynamic meals removed.`);
                    refreshMainQueries();
                    loadAll();
                  } catch (err) {
                    console.error(err);
                    toast.error("Error purging category sequence.");
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-red-500/20"
              >
                Purge All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
