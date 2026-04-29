import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Screen,
  ServiceType,
  PaymentMethod,
  CartItem,
  Product,
  Member,
  Voucher,
} from './types';
import { CATEGORIES as FALLBACK_CATEGORIES } from './constants';
import WelcomeScreen from './components/screens/WelcomeScreen';
import ServiceTypeScreen from './components/screens/ServiceTypeScreen';
import MenuScreen from './components/screens/MenuScreen';
import CartScreen from './components/screens/CartScreen';
import ScannerScreen from './components/screens/ScannerScreen';
import MemberBenefitsScreen from './components/screens/MemberBenefitsScreen';
import QRISScreen from './components/screens/QRISScreen';
import CashScreen from './components/screens/CashScreen';
import SuccessScreen from './components/screens/SuccessScreen';
import HandTracking from './components/HandTracking';
import { fetchFromSheet } from '@ngolab/shared-lib';

const UserKiosk: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.WELCOME);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [useKoin, setUseKoin] = useState(false);
  const [orderId, setOrderId] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [handTrackingEnabled, setHandTrackingEnabled] = useState(false);
  const [virtualCursor, setVirtualCursor] = useState<{ x: number; y: number; pinching: boolean } | null>(null);

  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const pinchActiveRef = useRef(false);
  const pinchStartedAtRef = useRef(0);
  const pinchTriggeredRef = useRef(false);
  const pinchSessionRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
    scrollTarget: HTMLElement | null;
  } | null>(null);
  const lastClickAtRef = useRef(0);
  const lastCursorPaintAtRef = useRef(0);

  const findClickableElement = useCallback((startEl: HTMLElement | null) => {
    let el: HTMLElement | null = startEl;
    while (el) {
      const role = el.getAttribute('role');
      const tag = el.tagName;
      const cursorStyle = window.getComputedStyle(el).cursor;
      if (
        tag === 'BUTTON' ||
        tag === 'A' ||
        tag === 'INPUT' ||
        tag === 'LABEL' ||
        role === 'button' ||
        typeof (el as any).onclick === 'function' ||
        cursorStyle === 'pointer' ||
        el.hasAttribute('data-gesture-click')
      ) {
        return el;
      }
      el = el.parentElement;
    }
    return startEl;
  }, []);

  const findGestureTarget = useCallback((x: number, y: number) => {
    const sampleOffsets = [
      [0, 0],
      [24, 0],
      [-24, 0],
      [0, 24],
      [0, -24],
      [16, 16],
      [16, -16],
      [-16, 16],
      [-16, -16],
      [36, 0],
      [-36, 0],
      [0, 36],
      [0, -36],
    ] as const;

    for (const [dx, dy] of sampleOffsets) {
      const px = Math.max(0, Math.min(window.innerWidth - 1, x + dx));
      const py = Math.max(0, Math.min(window.innerHeight - 1, y + dy));
      const rawEl = document.elementFromPoint(px, py) as HTMLElement | null;
      const target = findClickableElement(rawEl);
      if (target) return { target, clickX: px, clickY: py };
    }

    return null;
  }, [findClickableElement]);

  const findScrollableElement = useCallback((x: number, y: number) => {
    let el = document.elementFromPoint(x, y) as HTMLElement | null;
    while (el) {
      const style = window.getComputedStyle(el);
      const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 2;
      if (canScrollY) return el;
      el = el.parentElement;
    }

    const root = document.scrollingElement;
    return root instanceof HTMLElement ? root : null;
  }, []);

  const triggerGestureClick = useCallback((x: number, y: number) => {
    const targetHit = findGestureTarget(x, y);
    if (!targetHit) return;
    const { target, clickX, clickY } = targetHit;

    const eventInit: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      clientX: clickX,
      clientY: clickY,
      view: window,
    };

    target.dispatchEvent(new MouseEvent('pointerdown', eventInit));
    target.dispatchEvent(new MouseEvent('mousedown', eventInit));
    target.dispatchEvent(new MouseEvent('pointerup', eventInit));
    target.dispatchEvent(new MouseEvent('mouseup', eventInit));
    target.dispatchEvent(new MouseEvent('click', eventInit));
  }, [findGestureTarget]);

  const handleLandmarks = useCallback((trackingData: any) => {
    if (!trackingData || !trackingData.pointer) {
      setVirtualCursor((prev) => (prev ? null : prev));
      cursorRef.current = null;
      pinchActiveRef.current = false;
      pinchSessionRef.current = null;
      pinchTriggeredRef.current = false;
      return;
    }

    const pointer = trackingData.pointer;
    const targetX = Math.max(0, Math.min(window.innerWidth, pointer.mirroredXNorm * window.innerWidth));
    const targetY = Math.max(0, Math.min(window.innerHeight, pointer.yNorm * window.innerHeight));

    const prev = cursorRef.current;
    const smoothFactor = 0.35;
    const x = prev ? prev.x + (targetX - prev.x) * smoothFactor : targetX;
    const y = prev ? prev.y + (targetY - prev.y) * smoothFactor : targetY;

    cursorRef.current = { x, y };

    const now = Date.now();
    const pinchDistance = typeof trackingData.pinchDistance === 'number' ? trackingData.pinchDistance : null;
    const pinchStartThreshold = 0.055;
    const pinchReleaseThreshold = 0.075;
    const isPinching = pinchDistance === null
      ? Boolean(trackingData.pinch)
      : (pinchActiveRef.current ? pinchDistance < pinchReleaseThreshold : pinchDistance < pinchStartThreshold);

    const frameIntervalMs = 1000 / 24;
    if (now - lastCursorPaintAtRef.current >= frameIntervalMs) {
      lastCursorPaintAtRef.current = now;
      setVirtualCursor((prevCursor) => {
        if (!prevCursor) return { x, y, pinching: isPinching };
        const moved = Math.abs(prevCursor.x - x) > 1 || Math.abs(prevCursor.y - y) > 1;
        const pinchChanged = prevCursor.pinching !== isPinching;
        if (!moved && !pinchChanged) return prevCursor;
        return { x, y, pinching: isPinching };
      });
    }

    const cooldownMs = 550;
    const pinchHoldMs = 80;
    if (isPinching && !pinchActiveRef.current) {
      pinchStartedAtRef.current = now;
      pinchTriggeredRef.current = false;
      pinchSessionRef.current = {
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        moved: false,
        scrollTarget: findScrollableElement(x, y),
      };
    }

    if (isPinching && pinchSessionRef.current) {
      const session = pinchSessionRef.current;
      const deltaY = y - session.lastY;
      const movedDistance = Math.hypot(x - session.startX, y - session.startY);
      if (movedDistance > 14) {
        session.moved = true;
      }

      if (!session.scrollTarget) {
        session.scrollTarget = findScrollableElement(x, y);
      }

      if (session.scrollTarget && Math.abs(deltaY) > 1.25) {
        session.scrollTarget.scrollBy({ top: -deltaY * 2.3, behavior: 'auto' });
      }

      session.lastX = x;
      session.lastY = y;
    }

    const canTriggerClick = !pinchSessionRef.current?.moved;
    if (isPinching && canTriggerClick && !pinchTriggeredRef.current && now - pinchStartedAtRef.current >= pinchHoldMs && now - lastClickAtRef.current > cooldownMs) {
      triggerGestureClick(x, y);
      lastClickAtRef.current = now;
      pinchTriggeredRef.current = true;
    }

    if (!isPinching) {
      pinchTriggeredRef.current = false;
      pinchSessionRef.current = null;
    }

    pinchActiveRef.current = isPinching;
  }, [findScrollableElement, triggerGestureClick]);

  const cleanNumber = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const normalizeData = (dataArray: any[]) => {
    if (!dataArray || !Array.isArray(dataArray)) return [];
    return dataArray.map((item) => {
      const normalized: any = {};
      Object.keys(item).forEach((key) => {
        const cleanKey = key.toLowerCase().trim();
        normalized[cleanKey] = item[key];
      });
      return normalized;
    });
  };

  const refreshKioskData = async () => {
    setIsLoading(true);
    try {
      const rawData = await fetchFromSheet('initKiosk');

      if (rawData.products) {
        const normalizedProducts = normalizeData(rawData.products);
        const formattedProducts = normalizedProducts.map((p: any) => {
          const name = p.name || p.nama || p['nama produk'] || 'Menu Tanpa Nama';
          const price = p.price || p.harga || p['harga jual'] || 0;
          const category = p.category || p.kategori || 'lainnya';
          const id = p.id || p.code || p.kode || Math.random().toString();

          const isRecRaw = p.isrecommended || p.andalan || p.rekomendasi;
          const isRecommended = String(isRecRaw).toUpperCase() === 'TRUE' || isRecRaw === true;

          const imageUrl = p.image || p.foto || p.gambar || p['image url'] || p['link foto'] || p['link gambar'] || '';

          return {
            id: String(id),
            name: String(name),
            price: cleanNumber(price),
            category: String(category).toLowerCase().trim(),
            image: String(imageUrl).trim(),
            description: p.description || p.deskripsi || p.keterangan || '',
            isRecommended,
            cashbackReward: cleanNumber(p.cashbackreward || p.poin || p.reward),
          };
        });

        setProducts(formattedProducts);

        let finalCategories = [];
        if (rawData.categories && rawData.categories.length > 0) {
          const normalizedCats = normalizeData(rawData.categories);
          finalCategories = normalizedCats.map((c: any) => {
            const catId = String(c.id || c.name || c.kategori || '').toLowerCase().trim();
            const fallback = FALLBACK_CATEGORIES.find((f) => f.id.toLowerCase() === catId);
            return {
              id: catId,
              name: String(c.name || c.nama || c.id),
              icon: fallback?.icon || '◉',
            };
          });
        } else {
          finalCategories = FALLBACK_CATEGORIES;
        }

        if (!finalCategories.find((c: any) => c.id === 'all')) {
          finalCategories.splice(1, 0, { id: 'all', name: 'Semua Menu', icon: '◉' });
        }
        setCategories(finalCategories);

        if (rawData.vouchers) {
          const normalizedVouchers = normalizeData(rawData.vouchers);
          setVouchers(normalizedVouchers.map((v: any) => ({
            id: String(v.id || v.kode),
            title: String(v.title || v.nama || v.judul),
            description: String(v.description || v.deskripsi),
            discount: cleanNumber(v.discount || v.potongan || v.diskon),
            type: (v.type || v.tipe || 'FIXED').toUpperCase() as 'PERCENT' | 'FIXED',
          })));
        }
      }
    } catch (err) {
      console.error('Gagal sinkron kiosk:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshKioskData();
  }, []);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    return appliedVoucher.type === 'PERCENT' ? subtotal * (appliedVoucher.discount / 100) : appliedVoucher.discount;
  }, [appliedVoucher, subtotal]);

  const koinDiscount = useMemo(() => {
    if (!useKoin || !member) return 0;
    return Math.min(member.cashbackPoints || 0, subtotal - voucherDiscount);
  }, [useKoin, member, subtotal, voucherDiscount]);

  const total = Math.max(0, subtotal - (voucherDiscount + koinDiscount));

  const handleCompleteOrder = (method: PaymentMethod) => {
    const pointsEarned = cart.reduce((acc, item) => acc + ((item.cashbackReward || 0) * item.quantity), 0);

    const payload = {
      action: 'submitOrder',
      order: {
        orderId,
        service: serviceType,
        subtotal,
        discount: voucherDiscount + koinDiscount,
        total,
        payment: method,
        member: member ? member.name : 'Guest',
        memberCode: member ? member.code : '-',
        isAffiliate: member?.isAffiliate ? 'Yes' : 'No',
        voucher: appliedVoucher ? appliedVoucher.title : '-',
        pointsEarned,
        pointsUsed: koinDiscount,
      },
      rawCartData: JSON.stringify(cart),
    };

    fetchFromSheet('submitOrder', payload).catch((error) => {
      console.error('Gagal submit order ke backend:', error);
    });

    setCurrentScreen(Screen.SUCCESS);
  };

  const resetOrder = () => {
    setCart([]);
    setServiceType(null);
    setMember(null);
    setAppliedVoucher(null);
    setUseKoin(false);
    setOrderId(Math.floor(1000 + Math.random() * 9000).toString());
    setCurrentScreen(Screen.WELCOME);
    refreshKioskData();
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Menyiapkan Menu...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col relative bg-white font-sans selection:bg-orange-100">
      <button
        onClick={() => setHandTrackingEnabled((prev) => !prev)}
        className="fixed top-3 right-3 z-10001 px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider bg-slate-900/90 text-white border border-white/20 shadow-lg"
      >
        {handTrackingEnabled ? 'Matikan Gesture' : 'Aktifkan Gesture'}
      </button>

      {handTrackingEnabled && <HandTracking onLandmarks={handleLandmarks} />}

      {handTrackingEnabled && virtualCursor && (
        <div
          className="fixed z-10002 pointer-events-none"
          style={{
            left: `${virtualCursor.x}px`,
            top: `${virtualCursor.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`w-4 h-4 rounded-full border-2 border-white shadow-[0_0_20px_rgba(249,115,22,0.7)] ${virtualCursor.pinching ? 'bg-emerald-500/90 scale-125' : 'bg-orange-500/80'}`}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {currentScreen === Screen.WELCOME && <WelcomeScreen onStart={() => setCurrentScreen(Screen.SERVICE_TYPE)} />}
        {currentScreen === Screen.SERVICE_TYPE && (
          <ServiceTypeScreen
            onSelect={(type) => {
              setServiceType(type);
              setCurrentScreen(Screen.MENU);
            }}
            onBack={() => setCurrentScreen(Screen.WELCOME)}
          />
        )}
        {currentScreen === Screen.MENU && (
          <MenuScreen
            products={products}
            categories={categories}
            cart={cart}
            member={member}
            potentialPoints={cart.reduce((acc, item) => acc + ((item.cashbackReward || 0) * item.quantity), 0)}
            onAddToCart={(p) => setCart((prev) => {
              const ex = prev.find((i) => i.id === p.id);
              return ex ? prev.map((i) => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...p, quantity: 1 }];
            })}
            onUpdateQty={(id, delta) => setCart((prev) => {
              const updated = prev.map((i) => i.id === id ? { ...i, quantity: i.quantity + delta } : i);
              return updated.filter((i) => i.quantity > 0);
            })}
            onRemove={(id) => setCart((prev) => prev.filter((i) => i.id !== id))}
            onClearCart={() => setCart([])}
            onOpenCart={() => setCurrentScreen(Screen.CART)}
            onBack={() => setCurrentScreen(Screen.SERVICE_TYPE)}
            total={total}
          />
        )}
        {currentScreen === Screen.CART && (
          <CartScreen
            cart={cart}
            subtotal={subtotal}
            discount={voucherDiscount + koinDiscount}
            total={total}
            member={member}
            useKoin={useKoin}
            onToggleKoin={() => setUseKoin(!useKoin)}
            potentialPoints={cart.reduce((acc, item) => acc + ((item.cashbackReward || 0) * item.quantity), 0)}
            onRemoveMember={() => setMember(null)}
            appliedVoucher={appliedVoucher}
            onUpdateQty={(id, delta) => setCart((prev) => {
              const updated = prev.map((i) => i.id === id ? { ...i, quantity: i.quantity + delta } : i);
              return updated.filter((i) => i.quantity > 0);
            })}
            onRemove={(id) => setCart((prev) => prev.filter((i) => i.id !== id))}
            onScanMember={() => setCurrentScreen(Screen.SCANNER)}
            onSelectCashback={() => setCurrentScreen(Screen.MEMBER_BENEFITS)}
            onBack={() => setCurrentScreen(Screen.MENU)}
            onCheckout={(m) => m === PaymentMethod.QRIS ? setCurrentScreen(Screen.QRIS) : setCurrentScreen(Screen.CASH)}
          />
        )}
        {currentScreen === Screen.SCANNER && (
          <ScannerScreen
            onScanSuccess={async (scanned) => {
              try {
                const data = await fetchFromSheet('getMember', { code: scanned.code });
                if (data && !data.error) {
                  const nMember: any = {};
                  Object.keys(data).forEach((k) => {
                    nMember[k.toLowerCase().trim()] = data[k];
                  });
                  setMember({
                    code: String(nMember.code || nMember.Code),
                    name: String(nMember.name || nMember.Name),
                    points: cleanNumber(nMember.points),
                    cashbackPoints: cleanNumber(nMember.cashbackpoints || nMember.poin),
                    vouchers,
                    isAffiliate: nMember.affiliate === 'Yes' || nMember.isaffiliate === 'TRUE' || !!nMember.isaffiliate,
                  });
                } else {
                  setMember(scanned);
                }
              } catch {
                setMember(scanned);
              }
              setCurrentScreen(Screen.CART);
            }}
            onBack={() => setCurrentScreen(Screen.CART)}
          />
        )}
        {currentScreen === Screen.MEMBER_BENEFITS && (
          <MemberBenefitsScreen
            member={member}
            cart={cart}
            vouchers={vouchers}
            onSelectVoucher={(v) => {
              setAppliedVoucher(v);
              setCurrentScreen(Screen.CART);
            }}
            onBack={() => setCurrentScreen(Screen.CART)}
            onContinue={() => setCurrentScreen(Screen.CART)}
          />
        )}
        {currentScreen === Screen.QRIS && (
          <QRISScreen
            total={total}
            onComplete={() => handleCompleteOrder(PaymentMethod.QRIS)}
            onBack={() => setCurrentScreen(Screen.CART)}
          />
        )}
        {currentScreen === Screen.CASH && (
          <CashScreen
            onComplete={() => handleCompleteOrder(PaymentMethod.CASH)}
            onBack={() => setCurrentScreen(Screen.CART)}
          />
        )}
        {currentScreen === Screen.SUCCESS && (
          <SuccessScreen
            orderId={orderId}
            total={total}
            member={member}
            items={cart}
            onClose={resetOrder}
          />
        )}
      </div>
    </div>
  );
};

export default UserKiosk;
