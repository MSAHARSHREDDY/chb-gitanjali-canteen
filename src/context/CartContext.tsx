import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { menuItems, getMenuItems } from '../api/client';
import { StudentDetail } from '../types';
import toast from 'react-hot-toast';

export interface CartItem {
  id: string | number; // unique cart row id: itemId_studentName
  menuItemId: string | number; // original menu item id
  categoryId?: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  quantity: number;
  studentName: string;
}

interface CartContextType {
  items: CartItem[];
  students: StudentDetail[];
  addToCart: (item: { id: string | number; name: string; price: number; image?: string; images?: string[]; quantity?: number }, studentName?: string) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  updateStudentName: (id: string | number, newStudentName: string) => void;
  addStudent: (student: StudentDetail) => void;
  removeStudent: (name: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
  refreshStudents: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [menuItemsList, setMenuItemsList] = useState<any[]>(menuItems);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, token, logout } = useAuth();
  const initFetchDone = useRef(false);

  useEffect(() => {
    getMenuItems().then(data => {
      if (data && data.length > 0) {
        setMenuItemsList(data);
      }
    }).catch(err => {
      console.error("Error loading live menu items for cart:", err);
    });
  }, []);

  const refreshStudents = async () => {
    if (token) {
      try {
        const res = await fetch('/api/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          console.warn("Invalid token detected during refreshStudents, logging out.");
          logout();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped = data.map((s: any) => ({
              id: s._id || s.id,
              name: s.name,
              age: String(s.age),
              grade: s.studentClass || s.grade,
              studentClass: s.studentClass || s.grade,
              section: s.section,
              rollNo: s.rollNo,
              allergens: s.allergens || ['None'],
              intakeScore: s.intakeScore || 90,
              subscribedPlan: s.subscribedPlan || "",
              planActive: s.planActive || false,
              planExpiryDate: s.planExpiryDate || null
            }));
            setStudents(mapped);
          }
        }
      } catch (err) {
        console.error("Error refreshing students in CartContext:", err);
      }
    } else {
      setStudents([]);
    }
  };

  // Fetch actual students from backend if logged in
  useEffect(() => {
    refreshStudents();
  }, [token]);

  // Fetch cart initially from localStorage and reconcile with current menu
  useEffect(() => {
    const savedStudents = localStorage.getItem('localStudents');
    if (savedStudents) {
      try {
        const parsed = JSON.parse(savedStudents);
        if (Array.isArray(parsed)) {
          const mapped = parsed.map((item, idx) => {
            if (typeof item === 'string') {
              return {
                id: `sib-${idx + 1}-${Date.now()}`,
                name: item,
                age: '10',
                grade: 'Class 4',
                studentClass: 'Class 4',
                section: 'B',
                rollNo: `GS-2026-102${idx}`,
                allergens: ['None'],
                intakeScore: 100
              };
            }
            if (item && !item.studentClass && item.grade) {
              item.studentClass = item.grade;
            }
            return item;
          });
          setStudents(mapped);
        }
      } catch (e) {
        console.error("Failed to parse localStudents", e);
      }
    }

    const savedCart = localStorage.getItem('localCart');
    if (savedCart) {
      try {
        const parsedCart: CartItem[] = JSON.parse(savedCart);
        
        // Reconcile with latest menu items to get updated prices & names
        const reconciled = parsedCart.map(cartItem => {
          const mItemId = cartItem.menuItemId || cartItem.id;
          const menuItem = menuItemsList.find(m => String(m._id || m.id) === String(mItemId));
          if (menuItem) {
            return {
              ...cartItem,
              menuItemId: mItemId,
              categoryId: menuItem.categoryId,
              name: `${menuItem.categoryId} - ${menuItem.name}`,
              price: menuItem.price, // Latest price
            };
          }
          return {
            ...cartItem,
            menuItemId: mItemId
          };
        });
        
        setItems(reconciled);
      } catch(e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Sync cart to localStorage on changes
  useEffect(() => {
    localStorage.setItem('localCart', JSON.stringify(items));
  }, [items]);

  // Sync students to localStorage on changes
  useEffect(() => {
    localStorage.setItem('localStudents', JSON.stringify(students));
  }, [students]);

  // Reassign cart items belonging to "Registered Student" if real students are now available
  useEffect(() => {
    if (students.length > 0 && items.length > 0) {
      const realStudent = students.find(s => s.name && s.name !== "Registered Student");
      if (realStudent) {
        let changed = false;
        const reconciledItems = items.map(item => {
          if (!item.studentName || item.studentName === "Registered Student") {
            changed = true;
            const originalId = item.menuItemId || String(item.id).split('_')[0];
            return {
              ...item,
              id: `${originalId}_${realStudent.name}`,
              studentName: realStudent.name
            };
          }
          return item;
        });

        if (changed) {
          const deduped: CartItem[] = [];
          reconciledItems.forEach(item => {
            const existing = deduped.find(d => String(d.id) === String(item.id));
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              deduped.push(item);
            }
          });
          setItems(deduped);
        }
      }
    }
  }, [students, items]);

  const addStudent = async (student: StudentDetail) => {
    if (!student.name.trim()) return;
    if (students.some(s => s.name.trim().toLowerCase() === student.name.trim().toLowerCase())) return;
    
    if (token) {
      try {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: student.name,
            age: student.age || 7,
            rollNo: student.rollNo,
            studentClass: student.grade || student.studentClass || 'Class 1',
            section: student.section || 'A'
          })
        });
        if (response.ok) {
          const resData = await response.json();
          const mappedStudent: StudentDetail = {
            id: resData._id || resData.id,
            name: resData.name,
            age: String(resData.age),
            grade: resData.studentClass || resData.grade,
            studentClass: resData.studentClass || resData.grade,
            section: resData.section,
            rollNo: resData.rollNo,
            allergens: resData.allergens || ['None'],
            intakeScore: resData.intakeScore || 100,
            subscribedPlan: resData.subscribedPlan || "",
            planActive: resData.planActive || false,
            planExpiryDate: resData.planExpiryDate || null
          };
          setStudents(prev => [...prev, mappedStudent]);
          toast.success(`Student profile "${student.name}" automatically saved to your cloud profile!`);
          return;
        } else {
          const errData = await response.json().catch(() => null);
          console.error("Failed to automatically save student to database:", errData);
        }
      } catch (err) {
        console.error("Network error automatically saving student to database:", err);
      }
    }
    
    setStudents(prev => [...prev, student]);
  };

  const removeStudent = (name: string) => {
    setStudents(prev => prev.filter(s => s.name.trim().toLowerCase() !== name.trim().toLowerCase()));
  };

  const addToCart = (item: { id: string | number; name: string; price: number; image?: string; images?: string[]; quantity?: number }, defaultStudent?: string) => {
    toast.error("Canteen is temporarily closed. We will let you know once we reopen.", { id: 'temp-closed' });
    return;

    const activeStudent = defaultStudent || (students[0] && students[0].name) || 'Registered Student';
    const originalItemId = item.id;
    // unique cart key so same dish for different students are managed separately
    const rowId = `${originalItemId}_${activeStudent}`;

    // Find the original item to ensure latest category and name
    const menuItem = menuItemsList.find(m => String(m._id || m.id) === String(originalItemId));
    const enrichedName = menuItem ? `${menuItem.categoryId} - ${menuItem.name}` : item.name;
    const enrichedPrice = menuItem ? menuItem.price : item.price;
    const enrichedCategory = menuItem ? menuItem.categoryId : '';
    const addQty = item.quantity !== undefined ? item.quantity : 1;

    setItems((prev) => {
      const existing = prev.find((i) => String(i.id) === String(rowId));
      if (existing) {
        return prev.map((i) =>
          String(i.id) === String(rowId) ? { ...i, quantity: i.quantity + addQty } : i
        );
      }
      return [
        ...prev,
        {
          id: rowId,
          menuItemId: originalItemId,
          name: enrichedName,
          price: enrichedPrice,
          image: item.image,
          images: item.images,
          categoryId: enrichedCategory,
          quantity: addQty,
          studentName: activeStudent
        }
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string | number) => {
    setItems((prev) => prev.filter((i) => String(i.id) !== String(id)));
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (String(i.id) === String(id) ? { ...i, quantity } : i))
    );
  };

  const updateStudentName = (id: string | number, newStudentName: string) => {
    setItems((prev) => {
      const targetItem = prev.find((i) => String(i.id) === String(id));
      if (!targetItem) return prev;

      // When modifying the student of an item, it should change the student name
      // and update the id to match the new student key. If that new combination already exists,
      // we can merge the quantities!
      const originalItemId = targetItem.menuItemId || String(id).split('_')[0];
      const newRowId = `${originalItemId}_${newStudentName}`;

      const alreadyExists = prev.find((i) => String(i.id) === String(newRowId) && String(i.id) !== String(id));
      
      if (alreadyExists) {
        // Merge them and delete the old row
        return prev
          .filter((i) => String(i.id) !== String(id))
          .map((i) =>
            String(i.id) === String(newRowId)
              ? { ...i, quantity: i.quantity + targetItem.quantity }
              : i
          );
      } else {
        // Just rename the student and update row key
        return prev.map((i) =>
          String(i.id) === String(id)
            ? { ...i, id: newRowId, studentName: newStudentName }
            : i
        );
      }
    });
  };

  const clearCart = () => setItems([]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        students,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateStudentName,
        addStudent,
        removeStudent,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        totalItems,
        totalPrice,
        refreshStudents,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
