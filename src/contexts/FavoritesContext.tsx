
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Favorite, Property } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useProperties } from './PropertiesContext';

interface FavoritesContextType {
  favorites: Favorite[];
  addToFavorites: (propertyId: string) => Promise<void>;
  removeFromFavorites: (propertyId: string) => Promise<void>;
  isPropertyInFavorites: (propertyId: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { properties } = useProperties();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // استخدام مرجع لتخزين الاشتراك وتجنب إعادة الاشتراك بشكل متكرر
  const subscriptionRef = useRef<any>(null);

  // تحميل المفضلة عند تسجيل الدخول
  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }
    
    // تحميل المفضلة مرة واحدة
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            *,
            properties:property_id (*)
          `)
          .eq('user_id', currentUser.id);
          
        if (error) {
          console.error('Error fetching favorites:', error);
          return;
        }
        
        if (data) {
          const formattedFavorites = data.map((item: any) => {
            // Safely extract property data
            const propertyData = item.properties as any;
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
                property_type: (propertyData.property_type || 'شقة') as 'شقة' | 'غرفة' | 'سرير' | 'فيلا' | 'شاليه',
                status: (propertyData.status || 'للإيجار') as 'للإيجار' | 'للبيع' | 'للمصيف',
                amenities: propertyData.amenities,
                images: propertyData.images,
                description: propertyData.description,
                available: propertyData.available || false,
                createdAt: propertyData.created_at,
                updatedAt: propertyData.updated_at
              };
            }
            
            return {
              id: item.id,
              propertyId: item.property_id,
              property,
              userId: item.user_id
            } as Favorite;
          });
          
          setFavorites(formattedFavorites);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFavorites();
    
    // الاستماع للتغييرات في جدول المفضلة بشكل محسن
    // حماية من إعادة الاشتراك المتكرر
    if (!subscriptionRef.current && currentUser) {
      subscriptionRef.current = supabase
        .channel('favorites-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'favorites',
          filter: `user_id=eq.${currentUser.id}`
        }, (payload) => {
          // بدلاً من إعادة تحميل كل البيانات، نقوم بتحديث الحالة المحلية فقط
          if (payload.eventType === 'INSERT') {
            // إضافة عنصر جديد للمفضلة
            const newItem = payload.new as any;
            const property = properties.find(p => p.id === newItem.property_id);
            
            const newFavorite: Favorite = {
              id: newItem.id,
              propertyId: newItem.property_id,
              property,
              userId: newItem.user_id
            };
            
            setFavorites(prev => [...prev, newFavorite]);
          } else if (payload.eventType === 'DELETE') {
            // إزالة عنصر من المفضلة
            const oldItem = payload.old as any;
            setFavorites(prev => prev.filter(f => f.id !== oldItem.id));
          }
        })
        .subscribe();
    }
      
    // تنظيف الاشتراك عند إلغاء تثبيت المكون
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [currentUser, properties]);

  // تحسين وظائف المفضلة بتخزين مؤقت محلي
  const isPropertyInFavorites = useCallback((propertyId: string) => {
    return favorites.some(f => f.propertyId === propertyId);
  }, [favorites]);

  // تحسين وظيفة إضافة للمفضلة
  const addToFavorites = async (propertyId: string) => {
    if (!currentUser || currentUser.role === 'guest') {
      throw new Error('يجب تسجيل الدخول أولاً');
    }
    
    try {
      // التحقق من عدم وجود العقار في المفضلة بالفعل
      if (isPropertyInFavorites(propertyId)) {
        return; // العقار موجود بالفعل في المفضلة
      }
      
      // تحديث واجهة المستخدم أولاً للاستجابة السريعة
      const property = properties.find(p => p.id === propertyId);
      const tempId = `temp-${Date.now()}`;
      
      // إضافة مؤقتة للمفضلة في واجهة المستخدم
      const tempFavorite: Favorite = {
        id: tempId,
        propertyId,
        property,
        userId: currentUser.id
      };
      
      setFavorites(prev => [...prev, tempFavorite]);
      
      // إرسال البيانات إلى قاعدة البيانات
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          property_id: propertyId,
          user_id: currentUser.id
        })
        .select()
        .single();
        
      if (error) {
        // إلغاء التغيير المؤقت في حالة حدوث خطأ
        setFavorites(prev => prev.filter(f => f.id !== tempId));
        throw error;
      }
      
      if (data) {
        // تحديث المعرف المؤقت بالمعرف الحقيقي
        setFavorites(prev => 
          prev.map(f => f.id === tempId ? { ...f, id: data.id } : f)
        );
        toast.success('تمت إضافة العقار إلى المفضلة');
      }
    } catch (error: any) {
      console.error('Error adding to favorites:', error);
      toast.error('حدث خطأ أثناء إضافة العقار إلى المفضلة');
    }
  };

  // تحسين وظيفة إزالة من المفضلة
  const removeFromFavorites = async (propertyId: string) => {
    if (!currentUser) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }
    
    try {
      const favorite = favorites.find(f => f.propertyId === propertyId);
      
      if (!favorite) {
        return; // العقار غير موجود في المفضلة
      }
      
      // إزالة مؤقتة من واجهة المستخدم للاستجابة السريعة
      setFavorites(prev => prev.filter(f => f.propertyId !== propertyId));
      
      // إزالة من قاعدة البيانات
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favorite.id);
        
      if (error) {
        // استعادة العنصر في حالة حدوث خطأ
        setFavorites(prev => [...prev, favorite]);
        throw error;
      }
      
      toast.success('تمت إزالة العقار من المفضلة');
    } catch (error: any) {
      console.error('Error removing from favorites:', error);
      toast.error('حدث خطأ أثناء إزالة العقار من المفضلة');
    }
  };

  const contextValue: FavoritesContextType = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isPropertyInFavorites,
    isLoading
  };

  return <FavoritesContext.Provider value={contextValue}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
