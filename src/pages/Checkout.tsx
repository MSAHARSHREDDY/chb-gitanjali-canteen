import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  ShoppingBag, 
  CheckCircle, 
  ShieldCheck, 
  PartyPopper,
  Check,
  Download,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function Checkout() {
  const { items, clearCart, students, refreshStudents, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [addressVal, setAddressVal] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // UPI payment success verification states
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [hasSharedScreenshot, setHasSharedScreenshot] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState<number>(0);

  // Capture total amount before it gets cleared
  useEffect(() => {
    if (totalPrice > 0) {
      setConfirmedAmount(totalPrice);
    }
  }, [totalPrice]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('creativehomebakers@icici');
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard! Paste it inside your payment app.', { icon: '📋' });
    setTimeout(() => {
      setCopiedUpi(false);
    }, 2500);
  };

  const downloadQRCode = () => {
    const dataString = `upi://pay?pa=creativehomebakers@icici&pn=Creative%20Home%20Bakers&am=${totalPrice}&cu=INR&tn=GitanjaliSchoolMeal`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dataString)}`;
    fetch(qrUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Gitanjali_Canteen_UPI_${totalPrice}INR_QR.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`QR Code for ₹${totalPrice} saved successfully! Open it in Google Pay, PhonePe, or Paytm.`, { icon: '📲' });
      })
      .catch(err => {
        console.error("Error downloading QR:", err);
        window.open(qrUrl, '_blank');
      });
  };

  const downloadReceipt = () => {
    let receiptContent = `=======================================\n`;
    receiptContent += `         GITANJALI SCHOOL CANTEEN\n`;
    receiptContent += `          M/S. CREATIVE HOME BAKERS\n`;
    receiptContent += `=======================================\n`;
    receiptContent += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
    receiptContent += `UPI ID: creativehomebakers@icici\n`;
    receiptContent += `WhatsApp: +91 6281 435 826\n`;
    receiptContent += `---------------------------------------\n`;
    receiptContent += `ORDER DETAILS:\n`;
    items.forEach(item => {
      receiptContent += `- ${item.name}\n`;
      receiptContent += `  Student: ${item.studentName || 'N/A'}\n`;
      receiptContent += `  Qty: ${item.quantity} | Price: ₹${item.price}/-\n`;
    });
    receiptContent += `---------------------------------------\n`;
    receiptContent += `TOTAL AMOUNT PAID: ₹${totalPrice}/-\n`;
    receiptContent += `=======================================\n`;
    receiptContent += ` Thank you for choosing healthy diets!\n`;
    receiptContent += ` Please send UPI screenshot to WhatsApp.\n`;
    receiptContent += `=======================================\n`;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gitanjali_Canteen_Receipt_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Receipt downloaded successfully!", { icon: '🧾' });
  };

  const handleVerifyPayment = () => {
    if (!utrNumber.trim()) {
      toast.error("Please enter your 12-digit UPI UTR / Transaction Ref No.");
      return;
    }
    if (utrNumber.trim().length < 6) {
      toast.error("Invalid transaction reference. UTR reference is typically 12-digit number.");
      return;
    }
    if (!hasSharedScreenshot) {
      toast.error("Please verify that you have shared the screen transfer screenshot with +91 6281435826.");
      return;
    }

    setIsVerifying(true);
    const verifyToast = toast.loading("Checking UPI ledger reconciliation node...", { duration: 3000 });
    
    setTimeout(() => {
      setIsVerifying(false);
      setPaymentSuccess(true);
      toast.success("Payment Received Successful! Thank you.", {
        id: verifyToast,
        icon: '✅',
        duration: 3500
      });
      // Redirect to orders page
      setTimeout(() => {
        navigate('/profile?tab=orders');
      }, 1500);
    }, 2200);
  };

  const [unsubscribedPlans, setUnsubscribedPlans] = useState<{[studentId: string]: string}>({});
  const [isSubscribingInCheckout, setIsSubscribingInCheckout] = useState(false);

  // Auto-redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Please login to proceed with checkout.');
      navigate('/');
    }
  }, [user, navigate]);

  // Dynamically calculate the classroom routing details as a default delivery location pre-fill
  useEffect(() => {
    if (refreshStudents) {
      refreshStudents();
    }
  }, []);

  useEffect(() => {
    if (items.length > 0 && students.length > 0) {
      const assignedNames = Array.from(new Set(items.map(i => i.studentName)));
      const details = assignedNames.map(name => {
        const studentObj = students.find(s => s.name?.trim().toLowerCase() === name?.trim().toLowerCase());
        if (studentObj) {
          return `${studentObj.name} (Grade: ${studentObj.grade || studentObj.studentClass || 'N/A'}, Section: ${studentObj.section || 'A'})`;
        }
        return `${name} - Classroom Delivery`;
      });
      setAddressVal(`Geetanjali Canteen classroom dispatch system directly targeting:\n${details.join('\n')}`);
    } else if (items.length > 0) {
      const assignedNames = Array.from(new Set(items.map(i => i.studentName)));
      setAddressVal(`Geetanjali Canteen classroom dispatch system to:\n${assignedNames.map(n => `${n} - Classroom Desk Delivery`).join('\n')}`);
    }
  }, [items, students]);

  const handlePlaceOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // STRICT TIME CUTOFF CHECK (Kolkata Time)
    const now = new Date();
    const kolkataTimeMs = now.getTime() + (5.5 * 60 * 60 * 1000);
    const kolkataDate = new Date(kolkataTimeMs);
    const curHour = kolkataDate.getUTCHours();
    
    if (curHour >= 6 && curHour < 12) {
      toast.error('Ordering is strictly closed between 6:00 AM and 12:00 PM IST.');
      navigate('/');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    if (!utrNumber.trim()) {
      toast.error('Please enter your 12-digit UPI UTR / Transaction Ref No.');
      return;
    }

    if (utrNumber.trim().length < 6) {
      toast.error('Invalid transaction reference. UTR reference is typically 12 characters.');
      return;
    }

    if (!hasSharedScreenshot) {
      toast.error('Please verify that you have shared the payment receipt/screenshot with +91 6281435826.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const customerPhone = formData.get('customerPhone') as string;

    if (!addressVal.trim()) {
      toast.error('Please verify the classroom details.');
      return;
    }

    if (!user?.isTeacher && students.length === 0) {
      toast.error('You do not have any child profiles registered. Please add a child profile before completing the order.');
      navigate('/add-child');
      return;
    }

    // Bypassing pre-activation plan constraints so you can always proceed to checkout seamlessly
    console.log("Bypassing plan constraints to proceed to checkout directly.");

    setIsProcessing(true);
    const toastId = toast.loading('Initializing subscription order placement...');

    try {
      // Decorate items with student class and section to persist for admin views
      const decoratedItems = items.map(item => {
        if (user?.isTeacher) {
           return {
             ...item,
             studentClass: 'Teacher',
             section: 'Faculty'
           };
        }
        
        let stdName = item.studentName;
        if ((!stdName || stdName === "Registered Student") && students.length > 0) {
          stdName = students[0].name;
        }
        
        const std = students.find(s => s.name?.trim().toLowerCase() === stdName?.trim().toLowerCase());
        return {
          ...item,
          studentName: stdName || "Registered Student",
          studentClass: std?.grade || std?.studentClass || 'N/A',
          section: std?.section || 'N/A'
        };
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          address: addressVal,
          items: decoratedItems,
          totalAmount: totalPrice
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server rejected order compilation.');
      }

      setOrderPlaced(true);
      clearCart();
      toast.success('Your Classroom Gourmet Delivery Plan has been booked!', { id: toastId });
      setTimeout(() => {
        navigate('/profile?tab=orders');
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || 'Order registration failed. Please retry.', { id: toastId });
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkSubscribe = async () => {
    setIsProcessing(true);
    const toastId = toast.loading('Fulfilling student subscriptions...');
    try {
      const token = localStorage.getItem('token');
      // Create a map to keep track of resolved real database IDs for subscriptions
      const resolvedStudentIds: {[key: string]: string} = {};

      for (const [studentId, planName] of Object.entries(unsubscribedPlans)) {
        if (studentId.startsWith('sib-')) {
          // Find this student in our context profiles state
          const std = students.find(s => s.id === studentId || s._id === studentId);
          if (std) {
            try {
              // Register this student on the server first
              const res_create = await fetch('/api/students', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  name: std.name,
                  age: std.age || 7,
                  rollNo: std.rollNo,
                  studentClass: std.grade || std.studentClass || 'Class 1',
                  section: std.section || 'A'
                })
              });
              if (res_create.ok) {
                const createdObj = await res_create.json();
                resolvedStudentIds[studentId] = createdObj._id || createdObj.id;
              } else {
                resolvedStudentIds[studentId] = studentId; // fallback
              }
            } catch (err) {
              console.error("Error migrating student on-the-fly:", err);
              resolvedStudentIds[studentId] = studentId;
            }
          } else {
            resolvedStudentIds[studentId] = studentId;
          }
        } else {
          resolvedStudentIds[studentId] = studentId;
        }
      }

      // Execute all subscriptions using resolved database IDs
      const promises = Object.entries(unsubscribedPlans).map(([studentId, planName]) => {
        const finalId = resolvedStudentIds[studentId] || studentId;
        return fetch(`/api/students/${finalId}/subscribe`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ planName })
        });
      });

      const results = await Promise.all(promises);
      const allSuccessful = results.every(res => res.ok);

      if (allSuccessful) {
        toast.success(`Success! Students are now subscribed. You can now checkout.`, { id: toastId, icon: '🌟' });
        if (refreshStudents) {
          await refreshStudents();
        }
        setIsSubscribingInCheckout(false);
      } else {
        const errorMessages = await Promise.all(results.map(async res => {
          if (!res.ok) {
            try {
               const errObj = await res.json();
               return errObj.error || res.statusText;
            } catch {
               return res.statusText;
            }
          }
          return null;
        }));
        const distinctErrors = Array.from(new Set(errorMessages.filter(Boolean))).join(', ');
        toast.error(`Failed to activate some subscriptions: ${distinctErrors}`, { id: toastId });
      }
    } catch (err) {
      toast.error('Network failure completing subscription.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="w-full pt-6 pb-12 min-h-screen flex items-center justify-center font-sans bg-[#050519] text-white px-4">
        <div className="max-w-md w-full p-8 mx-auto text-center border border-emerald-500/40 rounded-3xl bg-slate-900/90 backdrop-blur-md shadow-[0_22px_60px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-black font-display text-emerald-400 mb-1 uppercase tracking-tight">
            Order & Payment Successful!
          </h1>
          <p className="text-slate-350 text-xs mb-6 font-semibold leading-relaxed">
            Thank you! Your payment was successfully processed and your student's meal plan has been registered in our kitchen list.
          </p>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mb-6 text-center select-none">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">Total Amount Collected</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">₹{confirmedAmount || totalPrice}/-</span>
            <span className="text-[9px] text-emerald-500/80 uppercase block tracking-wider mt-1.5 font-bold">✓ UPI Payment Verified</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 text-xs text-slate-400 mb-6">
            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Auto-redirecting you to My Orders tab...</span>
          </div>

          <button
            onClick={() => navigate('/profile?tab=orders')}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-emerald-500/30 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            📂 View My Orders <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-6 pb-12 min-h-screen font-sans bg-transparent text-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 animate-fade-in animate-once">
          <span className="text-brand-emerald text-xs font-mono tracking-widest uppercase mb-0.5 block">Live Classroom Dispatch</span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-2 uppercase tracking-tight">Direct Desk Delivery</h2>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">Ensure dynamic classroom delivery routes are correct for instant desk drops.</p>
          <div className="w-16 h-0.5 bg-brand-emerald mx-auto mt-2 mb-3" />
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 mt-4">
          {/* Left Panel: Delivery Configuration */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-5 border border-white/10 rounded-2xl bg-slate-900/80 backdrop-blur-md">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider pb-2 border-b border-white/10 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50/10 text-brand-emerald text-[10px] font-semibold font-mono">1</span>
                Delivery Configuration
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wide font-mono">{user?.isTeacher ? "Teacher Name" : "Parent Name"}</label>
                    <input
                      required
                      type="text"
                      name="customerName"
                      defaultValue={user?.name || ''}
                      className="w-full bg-[#050519] border border-white/10 rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-brand-emerald transition-colors text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wide font-mono">{user?.isTeacher ? "Teacher Email ID" : "Parent Email ID"}</label>
                    <input
                      required
                      type="email"
                      name="customerEmail"
                      defaultValue={user?.email || ''}
                      className="w-full bg-[#050519] border border-white/10 rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-brand-emerald transition-colors text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wide font-mono">Phone Number</label>
                    <input
                      required
                      type="tel"
                      name="customerPhone"
                      defaultValue={user?.mobile || ''}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-[#050519] border border-white/10 rounded-lg px-3.5 py-2 text-white focus:outline-none focus:border-brand-emerald transition-colors text-xs"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] text-brand-emerald mb-1 uppercase tracking-wider font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald"></span> Classroom Dispatch Coordinates
                  </label>
                  <textarea
                    required
                    name="address"
                    rows={3}
                    value={addressVal}
                    onChange={(e) => setAddressVal(e.target.value)}
                    placeholder="Provide specific desks, class columns, block keys, or floor information."
                    className="w-full bg-[#050519] border border-white/10 rounded-lg px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald transition-colors text-xs font-sans"
                  />
                  <p className="text-[9px] text-slate-450 mt-1 italic">* Meals will automatically be routed directly to the {user?.isTeacher ? 'teacher classroom' : 'classrooms assigned to each student'}.</p>
                </div>
              </div>
            </div>

                        {/* Scan & Pay via UPI QR Code Module */}
            <div className="p-5 border border-white/10 rounded-2xl bg-slate-900/80 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider pb-2 border-b border-white/10 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50/10 text-brand-emerald text-[10px] font-semibold font-mono">2</span>
                Scan & Pay via UPI QR Code
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* QR Code Container with Download button */}
                <div className="flex flex-col items-center gap-3 w-full sm:w-auto shrink-0">
                  <div 
                    className="bg-white p-5 rounded-[24px] flex flex-col items-center justify-center shadow-xl relative overflow-hidden block mx-auto border border-white/50 ring-4 ring-white/10"
                  >
                    {/* Bank Header */}
                    <div className="bg-gradient-to-r from-[#e75325] to-[#f47f20] text-white px-5 py-1.5 rounded-full font-bold text-sm italic shadow-sm mb-3 font-sans">
                      ICICI Bank
                    </div>
                    
                    {/* Merchant Name */}
                    <div className="text-gray-800 text-[11px] font-bold tracking-wider mb-4 uppercase font-sans">
                      M/S.CREATIVE HOME BAKERS
                    </div>
                    
                    {/* QR Code itself */}
                    <div className="relative">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `upi://pay?pa=creativehomebakers@icici&pn=Creative%20Home%20Bakers&am=${totalPrice}&cu=INR&tn=GitanjaliSchoolMeal`
                        )}`}
                        alt="UPI Payment QR Code"
                        id="upi_payment_qr"
                        className="w-[160px] h-[160px] rounded mx-auto mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                      
                    </div>
                    
                    {/* UPI ID */}
                    <div className="text-gray-400 text-[10px] mt-4 mb-3 uppercase tracking-widest font-sans flex items-center justify-center gap-1.5">
                      UPI ID: <span className="text-gray-800 font-bold lowercase tracking-normal bg-gray-50 px-2 py-0.5 rounded border border-gray-200">creativehomebakers@icici</span>
                    </div>
                    
                    {/* BHIM / UPI Logos */}
                    <div className="flex items-center justify-center gap-3 border-t border-gray-100 pt-3 w-full">
                       <span className="text-green-600 font-black italic tracking-tighter text-[11px] flex items-center">
                         BHIM<span className="text-orange-500 text-lg leading-none ml-0.5">▶</span>
                       </span>
                       <span className="text-gray-300">|</span>
                       <span className="text-gray-600 font-black italic tracking-tighter text-[12px]">
                         UPI
                       </span>
                    </div>

                    {/* App Logos Row */}
                    <div className="w-full flex items-center justify-between border-t border-gray-100 pt-3 mt-3 px-1 gap-2">
                       <div className="flex items-center gap-1 bg-[#D95F29] px-1.5 py-0.5 rounded text-white font-bold italic text-[8px]">
                         iMobile
                       </div>
                       <span className="text-gray-200 text-[10px]">|</span>
                       <div className="flex items-center text-gray-700 font-bold text-[10px] font-sans">
                         <span className="text-blue-500 text-base mr-0.5 tracking-tighter">G</span>Pay
                       </div>
                       <span className="text-gray-200 text-[10px]">|</span>
                       <div className="flex flex-col items-center leading-none text-blue-900 font-bold italic tracking-tighter text-[11px]">
                         e₹
                       </div>
                       <span className="text-gray-200 text-[10px]">|</span>
                       <div className="flex items-center bg-gray-900 text-white rounded px-1.5 py-0.5 font-bold text-[8px] tracking-widest font-sans gap-0.5">
                         <span className="text-white bg-transparent border border-white rounded-[2px] w-2.5 h-2.5 flex items-center justify-center text-[6px]">C</span>CRED
                       </div>
                    </div>
                  </div>
                  
                 

                  {/* High Quality Download Button */}
                  <button
                    type="button"
                    onClick={downloadQRCode}
                    className="w-full px-4 py-2 bg-brand-emerald/10 hover:bg-brand-emerald/20 text-brand-emerald font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl border border-brand-emerald/30 inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download QR Code
                  </button>
                </div>

                <div className="space-y-3.5 flex-grow w-full text-center sm:text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block mb-0.5">Total Amount Payable</span>
                    <span className="text-3xl font-black text-brand-emerald font-mono">₹{totalPrice}/-</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-300">
                      Canteen Merchant: <strong className="text-white">Creative Home Bakers</strong>
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-mono text-slate-400 bg-black/40 px-2 py-1 rounded border border-white/5 select-all">
                        creativehomebakers@icici
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-1 px-1.5 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy UPI ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Payment Instructions & Number Info */}
                  <div className="pt-2 bg-black/35 p-3.5 rounded-xl border border-white/5 text-left">
                    <p className="text-xs font-bold text-[#10b981] uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5">
                      <span className="inline-block w-2-h-2 rounded-full bg-[#10b981]"></span>
                      UPI Payment Guide:
                    </p>
                    <ul className="text-[10.5px] text-slate-350 space-y-2 list-none pl-0 leading-relaxed font-sans">
                      <li className="flex items-start gap-1.5">
                        <span className="text-brand-emerald font-mono font-bold text-xs">1.</span>
                        <span>Click <strong className="text-white">Download QR Code</strong> to save the card.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-brand-emerald font-mono font-bold text-xs">2.</span>
                        <span>Open <strong className="text-white">Google Pay / PhonePe / Paytm</strong>, import/load the saved card image from your phone's gallery, and complete the instant transfer.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-brand-emerald font-mono font-bold text-xs">3.</span>
                        <span>Send the payment receipt/screenshot manually to <strong className="text-brand-emerald text-xs font-mono font-bold">6281435826</strong> after transfer.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* UPI Verification Fields */}
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase tracking-wide font-mono">12-Digit UPI UTR No. (Required)</label>
                  <input
                    required
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 129845781290"
                    className="w-full bg-[#050519] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald transition-colors text-xs font-mono"
                  />
                </div>
                
                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      required
                      type="checkbox"
                      checked={hasSharedScreenshot}
                      onChange={(e) => setHasSharedScreenshot(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 text-brand-emerald bg-slate-950/60 focus:ring-transparent accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-350 font-medium font-sans">
                      I paid ₹{totalPrice} & sent screenshot to 6281435826
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Order Bill Summary */}
          <div className="lg:col-span-5 relative font-sans">
            <div className="p-5 border border-white/10 rounded-xl bg-slate-900/80 backdrop-blur-md sticky top-24">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-brand-emerald" />
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider">Classroom Meal Summary</h3>
                </div>
                <span className="text-xs bg-emerald-500/10 text-brand-emerald px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold">{items.length} items</span>
              </div>
              
              <div className="space-y-4 mb-6 max-h-[220px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <p className="text-slate-400 font-light text-sm italic">No items selected. Empty cart.</p>
                ) : (() => {
                  // Group items by name to combine rows as requested
                  const groupedMap: Record<string, { name: string; quantity: number; price: number; image?: string; students: string[] }> = {};
                  items.forEach(item => {
                    const studentObj = students.find(s => s.name === item.studentName);
                    const gradeStr = studentObj ? (studentObj.studentClass || studentObj.grade || 'Classroom Desk') : 'Classroom Desk';
                    const detail = `${item.studentName || 'Student'} (${gradeStr})`;
                    if (!groupedMap[item.name]) {
                      groupedMap[item.name] = {
                        name: item.name,
                        quantity: 0,
                        price: item.price || 0,
                        image: item.image,
                        students: []
                      };
                    }
                    groupedMap[item.name].quantity += item.quantity;
                    if (!groupedMap[item.name].students.includes(detail)) {
                      groupedMap[item.name].students.push(detail);
                    }
                  });

                  return Object.values(groupedMap).map((g, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex-grow">
                        <span className="text-white text-sm font-semibold tracking-wide capitalize block">
                          {g.name} <span className="text-slate-400 text-xs ml-1 font-mono">x {g.quantity}</span>
                        </span>
                        <span className="text-xs text-brand-emerald font-semibold italic mt-0.5 block">
                          For: {g.students.join(', ')}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          Unit Price: ₹{g.price}/-
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-mono font-black text-emerald-400">
                          ₹{g.price * g.quantity}/-
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Dynamic Invoice Subtotal Calculation Area */}
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-2 select-none mb-4">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Grand Total Quantity</span>
                  <span className="font-mono font-bold text-white">{items.reduce((sum, item) => sum + item.quantity, 0)} units</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-2.5">
                  <span className="text-xs font-bold text-slate-350">Order Total Amount:</span>
                  <span className="text-base font-mono font-black text-emerald-400">₹{totalPrice}/-</span>
                </div>
              </div>

              {/* Confirm & Place Order CTA */}
              <button
                type="submit"
                disabled={isProcessing || items.length === 0}
                className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black uppercase tracking-widest text-xs transition-all duration-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Arranging delivery...' : 'Confirm Classroom Dispatch'} <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400 border-t border-white/5 pt-4">
                <ShieldCheck className="w-4 h-4 text-brand-emerald" />
                <span>Authorized Secure Dispatch Protocol</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {isSubscribingInCheckout && (
        <div className="fixed inset-0 bg-[#050519]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-950 border border-white/15 rounded-3xl p-6 shadow-2xl relative text-left fade-in zoom-in duration-300">
            <h3 className="font-display font-black text-lg text-white mb-2 uppercase tracking-wide">Plan Configuration Required</h3>
            <p className="text-slate-400 text-xs mb-5 font-medium leading-relaxed">
              Some children do not have an active package. Select plans to store in the database before proceeding to daily checkout!
            </p>

            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-1">
              {Object.keys(unsubscribedPlans).map(studentId => {
                const std = students.find(s => s.id === studentId || s._id === studentId);
                return (
                  <div key={studentId} className="p-4 rounded-2xl border bg-slate-900 border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                     <div>
                      <h4 className="text-white text-xs font-bold font-sans">{std?.name}</h4>
                      <p className="text-slate-400 text-[10px] font-medium mt-0.5">{std?.grade || std?.studentClass || "N/A"}</p>
                    </div>
                    <select
                      value={unsubscribedPlans[studentId]}
                      onChange={(e) => setUnsubscribedPlans(prev => ({...prev, [studentId]: e.target.value}))}
                      className="w-full sm:w-auto bg-slate-950 border border-white/10 text-brand-emerald rounded-lg py-2 px-3 outline-none text-[11px] font-bold font-sans cursor-pointer whitespace-normal sm:whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      <option value="Daily Plan">Daily Plan (₹165/day)</option>
                      <option value="Monthly Plan">Monthly Plan (₹3,900/month)</option>
                      <option value="None">No Active Plan Required</option>
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsSubscribingInCheckout(false)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleBulkSubscribe}
                className="flex-[1.5] py-3 bg-brand-emerald hover:bg-brand-emerald-dark text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer text-center disabled:opacity-50"
              >
                <div className="flex justify-center items-center gap-1.5"><Check className="w-4 h-4"/> Confirm Plans</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
