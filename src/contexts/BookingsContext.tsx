import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BookingRequest, Property, PropertyType, PropertyStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useProperties } from './PropertiesContext';
import { debounce } from 'lodash';

interface BookingsContextType {
  bookingRequests: BookingRequest[];
  requestBooking: (propertyId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: 'approved' | 'rejected') => Promise<void>;
  isLoading: boolean;
  refreshBookings: () => Promise<void>;
}

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

export const BookingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { properties } = useProperties();
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const subscriptionRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  // تحسين أداء جلب البيانات
  const fetchBookingRequests = useCallback(async (force: boolean = false) => {
    // تجنب التحميل المتكرر إذا كان هناك طلب جارٍ
    if (fetchInProgressRef.current && !force) return;
    if (!currentUser || !isMountedRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('booking_requests')
        .select(`
          id,
          property_id,
          user_id,
          full_name,
          faculty,
          batch,
          phone,
          alternative_phone,
          status,
          created_at,
          updated_at,
          properties:property_id (
            id,
            name,
            location,
            rooms,
            bathrooms,
            size,
            beds,
            price,
            discount,
            property_type,
            status,
            amenities,
            images,
            description,
            available,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (currentUser.role !== 'admin') {
        query = query.eq('user_id', currentUser.id);
      }
        
      const { data, error: fetchError } = await query;
        
      if (fetchError) {
        console.error('Error fetching booking requests:', fetchError);
        setError(fetchError.message);
        toast.error(`خطأ في جلب طلبات الحجز: ${fetchError.message}`);
        return;
      }
      
      if (data && isMountedRef.current) {
        const formattedRequests = data.map((item: any) => {
          const propertyData = item.properties;
          let property: Property | undefined = undefined;
          
          if (propertyData) {
            property = {
              id: propertyData.id,
              name: propertyData.name,
              location: propertyData.location,
              rooms: propertyData.rooms,
              bathrooms: propertyData.bathrooms,
              size: propertyData.size,
              beds: propertyData.beds || 1,
              price: propertyData.price,
              discount: propertyData.discount || 0,
              property_type: (propertyData.property_type || 'شقة') as PropertyType,
              status: (propertyData.status || 'للإيجار') as PropertyStatus,
              amenities: propertyData.amenities || [],
              images: propertyData.images || [],
              description: propertyData.description || '',
              available: propertyData.available || false,
              createdAt: propertyData.created_at,
              updatedAt: propertyData.updated_at
            };
          }
          
          return {
            id: item.id,
            propertyId: item.property_id,
            property,
            userId: item.user_id,
            fullName: item.full_name || '',
            faculty: item.faculty || '', // Now fetched
            batch: item.batch || '', // Now fetched
            phone: item.phone || '', // Now fetched
            alternativePhone: item.alternative_phone || '', // Now fetched
            status: item.status as 'pending' | 'approved' | 'rejected',
            createdAt: item.created_at,
            updatedAt: item.updated_at
          } as BookingRequest;
        });
        
        setBookingRequests(formattedRequests);
        
        if (currentUser.role === 'admin' && formattedRequests.length === 0) {
          console.log('لا توجد طلبات حجز متاحة');
        }
      }
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
      setError(errorMessage);
      toast.error(`خطأ في جلب طلبات الحجز: ${errorMessage}`);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        fetchInProgressRef.current = false;
      }
    }
  }, [currentUser, toast]);

  // تحسين أداء التحديث التلقائي مع زيادة وقت الانتظار
  const debouncedFetch = useCallback(
    debounce(() => fetchBookingRequests(false), 3000),
    [fetchBookingRequests]
  );

  // تحديث عند عدم النشاط مع زيادة وقت الانتظار
  useEffect(() => {
    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActivityRef.current >= 30000) { // زيادة وقت الانتظار إلى 30 ثانية
        debouncedFetch();
        lastActivityRef.current = now;
      }
    };

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(checkIdle, 30000); // زيادة وقت الانتظار إلى 30 ثانية
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        debouncedFetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  // تحميل البيانات الأولية
  useEffect(() => {
    isMountedRef.current = true;
    
    if (currentUser) {
      fetchBookingRequests(true);
    } else {
      setBookingRequests([]);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [currentUser, fetchBookingRequests]);

  // تحسين الاستماع للتغييرات في قاعدة البيانات
  useEffect(() => {
    if (!currentUser || subscriptionRef.current) return;

    const setupSubscription = async () => {
      try {
        const channel = supabase.channel('booking-changes');
        
        channel
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'booking_requests',
              filter: currentUser.role === 'admin' ? undefined : `user_id=eq.${currentUser.id}`
            }, 
            (payload) => {
              if (!isMountedRef.current) return;

              // تجميع كل أنواع الأحداث في معالج واحد وإضافة تأخير
              // لتجنب التحديثات المتكررة في وقت قصير
              if (['INSERT', 'UPDATE', 'DELETE'].includes(payload.eventType)) {
                // تحديث آخر وقت نشاط لتجنب تحديثات متكررة
                lastActivityRef.current = Date.now();
                // استخدام التأخير المضبوط لتقليل عدد التحديثات
                debouncedFetch();
              }
            }
          )
          .subscribe((status) => {
            if (status !== 'SUBSCRIBED') {
              console.error('Failed to subscribe to booking changes');
            }
          });

        subscriptionRef.current = channel;
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [currentUser, debouncedFetch]);

  // تحسين وظيفة تحديث حالة الحجز
  const updateBookingStatus = useCallback(async (bookingId: string, status: 'approved' | 'rejected') => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('ليس لديك صلاحية لتعديل حالة الحجز');
    }
    
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('booking_requests')
        .update({ 
          status,
          updated_at: now
        })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // تحديث الحالة المحلية بعد نجاح التحديث في قاعدة البيانات
      setBookingRequests(prev => 
        prev.map(b => b.id === bookingId ? { ...b, status, updatedAt: now } : b)
      );
      
      toast.success(`تم ${status === 'approved' ? 'قبول' : 'رفض'} طلب الحجز بنجاح`);
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast.error(error.message || 'حدث خطأ أثناء تعديل حالة الحجز');
      throw error;
    }
  }, [currentUser]);

  const contextValue = {
    bookingRequests,
    requestBooking: async () => {}, // This is handled in PropertyDetailsPage now
    updateBookingStatus,
    isLoading,
    refreshBookings: async () => await fetchBookingRequests(true)
  };

  if (error) {
    console.error('BookingsContext Error:', error);
  }

  return <BookingsContext.Provider value={contextValue}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => {
  const context = useContext(BookingsContext);
  if (context === undefined) {
    throw new Error('useBookings must be used within a BookingsProvider');
  }
  return context;
};
