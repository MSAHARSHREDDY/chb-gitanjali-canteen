// Gitanjali School Canteen API Client
// Designed specifically for parent-student interactions and meal management.

const menuCategories = [
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "snacks", name: "Snacks" },
];

export const menuItems = [
  // Monday
  {
    id: 1,
    categoryId: "breakfast",
    day: "Monday",
    name: "Chapathi and Curry",
    description: "Soft flatbreads served with nutritious curry.",
    price: 65,
    spicy: false,
    prepTime: "10 min",
    rating: 4.8,
    calories: 180,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80",
  },
  {
    id: 2,
    categoryId: "lunch",
    day: "Monday",
    name: "Any Leafy Vegetable rice, Salad, Curd",
    description: "Nutritious leafy vegetable rice served with salad and curd.",
    price: 110,
    spicy: false,
    prepTime: "15 min",
    rating: 4.9,
    calories: 340,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80",
  },
  {
    id: 3,
    categoryId: "snacks",
    day: "Monday",
    name: "Veg /Paneer Puff",
    description: "Crispy puff pastry filled with vegetables or paneer.",
    price: 50,
    spicy: false,
    prepTime: "8 min",
    rating: 4.7,
    calories: 120,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80",
  },

  // Tuesday
  {
    id: 4,
    categoryId: "breakfast",
    day: "Tuesday",
    name: "Guntaponganalu with Chutney",
    description: "Traditional savory rice dumplings served with chutney.",
    price: 70,
    spicy: false,
    prepTime: "12 min",
    rating: 4.7,
    calories: 210,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80",
  },
  {
    id: 5,
    categoryId: "lunch",
    day: "Tuesday",
    name: "White Rice, Tomato Dal, Veg Fry, Curd, Salad",
    description: "White rice served with tomato dal, veg fry, curd, and fresh salad.",
    price: 120,
    spicy: false,
    prepTime: "15 min",
    rating: 4.8,
    calories: 380,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80",
  },
  {
    id: 6,
    categoryId: "snacks",
    day: "Tuesday",
    name: "Fruit Chat",
    description: "A zesty medley of farm-fresh fruits.",
    price: 60,
    spicy: false,
    prepTime: "10 min",
    rating: 4.9,
    calories: 150,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80",
  },

  // Wednesday
  {
    id: 7,
    categoryId: "breakfast",
    day: "Wednesday",
    name: "Idly and Chutney",
    description: "Steamed rice cakes served with chutney.",
    price: 60,
    spicy: false,
    prepTime: "10 min",
    rating: 4.6,
    calories: 190,
    isVeg: true,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8dhN-PbM2B41fR3MKZjMyev13PgckcztNIg&s",
  },
  {
    id: 8,
    categoryId: "lunch",
    day: "Wednesday",
    name: "Carrot Rice, Beet Root Rice, Curd, Papad, Fresh Fruits",
    description: "Nutritious carrot and beet root rice, curd, papad, and fresh fruits.",
    price: 130,
    spicy: false,
    prepTime: "18 min",
    rating: 4.9,
    calories: 420,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80",
  },
  {
    id: 9,
    categoryId: "snacks",
    day: "Wednesday",
    name: "Corn Sandwich",
    description: "Toasted sandwich filled with sweet corn.",
    price: 55,
    spicy: false,
    prepTime: "5 min",
    rating: 4.8,
    calories: 100,
    isVeg: true,
    image: "https://www.vegrecipesofindia.com/wp-content/uploads/2016/08/masala-corn-recipe-2.jpg",
  },

  // Thursday
  {
    id: 10,
    categoryId: "breakfast",
    day: "Thursday",
    name: "Poha, Fresh Fruits",
    description: "Flattened rice tempered with spices, served with fresh fruits.",
    price: 80,
    spicy: false,
    prepTime: "12 min",
    rating: 4.7,
    calories: 240,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80",
  },
  {
    id: 11,
    categoryId: "lunch",
    day: "Thursday",
    name: "Veg Fried Rice, Salad, Curd",
    description: "Delicious vegetable fried rice with a side of salad and curd.",
    price: 105,
    spicy: false,
    prepTime: "12 min",
    rating: 4.8,
    calories: 310,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80",
  },
  {
    id: 12,
    categoryId: "snacks",
    day: "Thursday",
    name: "Veg Manchurian",
    description: "Crispy vegetable dumplings in a savory sauce.",
    price: 65,
    spicy: false,
    prepTime: "7 min",
    rating: 4.7,
    calories: 160,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80",
  },

  // Friday
  {
    id: 13,
    categoryId: "breakfast",
    day: "Friday",
    name: "Dosa and Chutney",
    description: "Crispy fermented rice crepe served with coconut chutney.",
    price: 60,
    spicy: false,
    prepTime: "10 min",
    rating: 4.5,
    calories: 175,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80",
  },
  {
    id: 14,
    categoryId: "lunch",
    day: "Friday",
    name: "Bagara Rice, Masala Curry, Salad, Curd",
    description: "Aromatic bagara rice paired with masala curry, salad, and curd.",
    price: 130,
    spicy: false,
    prepTime: "20 min",
    rating: 5.0,
    calories: 460,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80",
  },
  {
    id: 15,
    categoryId: "snacks",
    day: "Friday",
    name: "Garlic Bread",
    description: "Baked garlic butter herb bread.",
    price: 70,
    spicy: false,
    prepTime: "10 min",
    rating: 4.8,
    calories: 230,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
  },

  // Saturday
  {
    id: 16,
    categoryId: "breakfast",
    day: "Saturday",
    name: "Veg Bambino",
    description: "Roasted wheat vermicelli cooked with vegetables.",
    price: 75,
    spicy: false,
    prepTime: "12 min",
    rating: 4.8,
    calories: 220,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=80",
  },
  {
    id: 17,
    categoryId: "lunch",
    day: "Saturday",
    name: "Tomato Rice, Curd Rice, Papad",
    description: "Tangy tomato rice paired with comforting curd rice and papad.",
    price: 115,
    spicy: false,
    prepTime: "15 min",
    rating: 4.7,
    calories: 350,
    isVeg: true,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlvjd5_lTRMztYLqVgLT27V1sd5QdwfgXcOg&s",
  },
  {
    id: 18,
    categoryId: "snacks",
    day: "Saturday",
    name: "Mini Donut and Kharis",
    description: "Sweet mini donuts and crispy kharis.",
    price: 75,
    spicy: false,
    prepTime: "8 min",
    rating: 4.8,
    calories: 210,
    isVeg: true,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
  },
];

const galleryItems = [
  { id: 1, type: "image", category: "kitchen", src: "https://plus.unsplash.com/premium_photo-1682435561654-20d84bec0057?w=800&q=80", title: "Clean & Hygienic Canteen Assembly Line" },
  { id: 2, type: "image", category: "food", src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80", title: "Nutritious Hot Salad Platters" },
  { id: 3, type: "image", category: "delivery", src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80", title: "Happy Student Delivery at First Bell" },
  { id: 4, type: "image", category: "kitchen", src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80", title: "FSSAI Approved Preparation Standards" },
];

let localMenuCategories = [...menuCategories];
if (typeof window !== "undefined") {
  const storedCats = localStorage.getItem("gitanjali_menu_categories");
  if (storedCats) {
    try {
      localMenuCategories = JSON.parse(storedCats);
    } catch (e) {
      console.error("Failed to parse gitanjali_menu_categories from localStorage", e);
    }
  } else {
    localStorage.setItem("gitanjali_menu_categories", JSON.stringify(menuCategories));
  }
}

let localMenuItems = [...menuItems];
// Removed localStorage caching to prevent stale images/data issues

export const getMenuCategories = async () => {
  return localMenuCategories;
};

export const getMenuItems = async (category?: string, day?: string) => {
  try {
    let url = '/api/menu?';
    if (category) url += `category=${category}&`;
    if (day) url += `day=${day}`;
    
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    if (!res.ok) throw new Error("Failed to fetch menu items");
    const data = await res.json();
    return data.length > 0 ? data : localMenuItems;
  } catch (error) {
    console.error("Error fetching menu items:", error);
    let filtered = [...localMenuItems];
    if (day && day !== "all") {
      filtered = filtered.filter(item => item.day?.toLowerCase() === day.toLowerCase());
    }
    if (category && category !== 'all') {
      filtered = filtered.filter(item => item.categoryId === category);
    }
    return filtered;
  }
};

export const updateMenuItemInStorage = async (updatedItem: any) => {
  try {
    const itemId = updatedItem._id || updatedItem.id;
    const res = await fetch(`/api/menu/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(updatedItem)
    });
    if (!res.ok) throw new Error("Failed to update menu item");
    const data = await res.json();
    localMenuItems = localMenuItems.map(item => item.id.toString() === data.id.toString() ? data : item);
    return data;
  } catch (error) {
    console.error("Error updating menu item:", error);
    throw error;
  }
};

export const deleteMenuItemInStorage = async (id: any) => {
  try {
    const res = await fetch(`/api/menu/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete menu item");
    localMenuItems = localMenuItems.filter(item => item.id.toString() !== id.toString());
    return localMenuItems;
  } catch (error) {
    console.error("Error deleting menu item:", error);
    localMenuItems = localMenuItems.filter(item => item.id.toString() !== id.toString());
    return localMenuItems;
  }
};

export const addMenuItemInStorage = async (newItem: any) => {
  try {
    const res = await fetch(`/api/menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(newItem)
    });
    if (!res.ok) throw new Error("Failed to create menu item");
    const data = await res.json();
    localMenuItems.unshift(data);
    return data;
  } catch (error) {
    console.error("Error creating menu item:", error);
    throw error;
  }
};

export const addMenuCategoryInStorage = async (newCat: any) => {
  localMenuCategories.push(newCat);
  if (typeof window !== "undefined") {
    localStorage.setItem("gitanjali_menu_categories", JSON.stringify(localMenuCategories));
  }
  return newCat;
};

export const resetMenuItemsToDefault = async () => {
  try {
    const res = await fetch(`/api/menu/reset`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to reset menu items");
    return await res.json();
  } catch (error) {
    console.error("Error resetting menu items:", error);
    throw error;
  }
};

export const updateMenuCategoryInStorage = async (updatedCat: any) => {
  localMenuCategories = localMenuCategories.map(cat => cat.id === updatedCat.id ? updatedCat : cat);
  if (typeof window !== "undefined") {
    localStorage.setItem("gitanjali_menu_categories", JSON.stringify(localMenuCategories));
  }
  return localMenuCategories;
};

export const deleteMenuCategoryInStorage = async (id: string) => {
  localMenuCategories = localMenuCategories.filter(cat => cat.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem("gitanjali_menu_categories", JSON.stringify(localMenuCategories));
  }
  localMenuItems = localMenuItems.filter(item => item.categoryId !== id);
  return localMenuCategories;
};

export const getGalleryItems = async () => {
  return galleryItems;
};

export const submitContact = async (formData: any) => {
  console.log("Submit contact", formData);
  return { success: true };
};

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem('token') : null;
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const getReservations = async () => {
  try {
    const res = await fetch("/api/reservations", {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error("Failed to fetch reservations");
    const data = await res.json();
    return data.map((r: any) => ({
      ...r,
      id: r._id || r.id
    }));
  } catch (error) {
    console.error("Error in getReservations:", error);
    const stored = typeof window !== "undefined" ? localStorage.getItem("kvr_reservations") : null;
    return stored ? JSON.parse(stored) : [];
  }
};

export const submitReservation = async (formData: any) => {
  try {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to submit reservation");
    }
    const data = await res.json();
    if (data.reservation) {
      data.reservation.id = data.reservation._id || data.reservation.id;
    }
    return data;
  } catch (error) {
    console.error("Error in submitReservation:", error);
    const randomSeatLetters = ['A', 'F', 'B', 'C', 'D', 'K'];
    const randomSeatNum = Math.floor(Math.random() * 24) + 1;
    const newRes = {
      id: Date.now(),
      name: formData.name || "Anonymous Passenger",
      email: formData.email || "",
      phone: formData.phone || "",
      date: formData.date || new Date().toISOString().split('T')[0],
      time: formData.time || "12:00",
      guests: Number(formData.guests) || 1,
      seatNumber: formData.seatNumber || `${randomSeatNum}${randomSeatLetters[Math.floor(Math.random() * randomSeatLetters.length)]}`,
      status: "Pending",
      classType: formData.classType || "First Class"
    };
    let stored = [];
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("kvr_reservations");
      stored = existing ? JSON.parse(existing) : [];
      stored.unshift(newRes);
      localStorage.setItem("kvr_reservations", JSON.stringify(stored));
    }
    return { success: true, reservation: newRes };
  }
};

export const updateReservationInStorage = async (updatedRes: any) => {
  try {
    const resId = updatedRes._id || updatedRes.id;
    const res = await fetch(`/api/reservations/${resId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(updatedRes)
    });
    if (!res.ok) throw new Error("Failed to update reservation");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error in updateReservationInStorage:", error);
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("kvr_reservations");
      if (existing) {
        let stored = JSON.parse(existing);
        stored = stored.map((r: any) => r.id.toString() === updatedRes.id.toString() ? updatedRes : r);
        localStorage.setItem("kvr_reservations", JSON.stringify(stored));
        return stored;
      }
    }
    return [updatedRes];
  }
};

export const deleteReservationInStorage = async (id: any) => {
  try {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete reservation");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error in deleteReservationInStorage:", error);
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("kvr_reservations");
      if (existing) {
        let stored = JSON.parse(existing);
        stored = stored.filter((r: any) => r.id.toString() !== id.toString());
        localStorage.setItem("kvr_reservations", JSON.stringify(stored));
        return stored;
      }
    }
    return [];
  }
};
