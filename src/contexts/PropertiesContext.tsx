import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Property, PropertyType, PropertyStatus, ResidentialUnitType, HousingCategory, AreaType, SpecialPropertyType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { PropertiesRow } from '@/types/database';

interface PropertiesContextType {
  properties: Property[];
  addProperty: (propertyData: {
    name: string;
    location: string;
    rooms: number;
    beds: number;
    price: number;
    discount: number;
    property_type: PropertyType;
    status: PropertyStatus;
    amenities: string[];
    images: string[];
    description: string;
    available: boolean;
    residential_unit_type?: ResidentialUnitType;
    housing_category?: HousingCategory;
    area_type?: AreaType;
    special_property_type?: SpecialPropertyType;
    bathrooms?: number;
    size?: number;
  }) => Promise<boolean>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<boolean>;
  deleteProperty: (id: string) => Promise<void>;
  duplicateProperty: (id: string) => Promise<void>;
  isLoading: boolean;
  getPropertyById: (id: string) => Promise<Property | null>;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export const PropertiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const subscriptionRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const fetchPropertiesRef = useRef<any>(null);
  
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect to database...');
      if (fetchPropertiesRef.current) {
        fetchPropertiesRef.current(false);
      }
    }, 5000);
  }, []);
  
  const fetchProperties = useCallback(async (showLoading = true) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    
    if (timeSinceLastFetch < 30000 && !showLoading) {
      console.log('تخطي fetchProperties: تم التحميل مؤخرًا');
      return;
    }
    
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      const cachedData = localStorage.getItem('cached_properties');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setProperties(parsed);
        } catch (e) {
          console.error('خطأ في تحليل البيانات المخزنة:', e);
        }
      }
      
      console.log('جلب البيانات من قاعدة البيانات...');
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching properties:', error);
        if (showLoading) {
          setIsLoading(false);
        }
        return;
      }
      
      setLastFetchTime(Date.now());
      
      if (data && Array.isArray(data)) {
        if (data.length === 0) {
          console.log('لا توجد عقارات في قاعدة البيانات');
          localStorage.setItem('cached_properties', JSON.stringify([]));
          setProperties([]);
        } else {
          const formattedProperties = data.map((item: PropertiesRow) => ({
            id: item.id,
            name: item.name || "عقار بدون اسم",
            location: item.location || "",
            rooms: item.rooms || 1,
            bathrooms: item.bathrooms || 1,
            size: item.size || 0,
            beds: item.beds || 1,
            price: item.price || 0,
            discount: item.discount || 0,
            property_type: (item.property_type || 'شقة') as PropertyType,
            status: (item.status || 'للإيجار') as PropertyStatus,
            amenities: item.amenities || [],
            images: item.images || [],
            description: item.description || "",
            available: item.available === undefined ? true : item.available,
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString(),
            residential_unit_type: item.residential_unit_type as ResidentialUnitType,
            housing_category: item.housing_category as HousingCategory,
            area_type: item.area_type as AreaType,
            special_property_type: (item.special_property_type || 'عادي') as SpecialPropertyType,
          }));
          
          localStorage.setItem('cached_properties', JSON.stringify(formattedProperties));
          setProperties(formattedProperties);
          console.log(`تم جلب ${formattedProperties.length} عقار من قاعدة البيانات`);
        }
      }
    } catch (error) {
      console.error('Error in fetchProperties:', error);
      if (properties.length === 0) {
        const cachedData = localStorage.getItem('cached_properties');
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            setProperties(parsed);
            console.log('استخدام بيانات العقارات المخزنة بعد فشل الاتصال');
          } catch (e) {
            console.error('خطأ في تحليل البيانات المخزنة:', e);
          }
        }
      }
      
      scheduleReconnect();
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [scheduleReconnect, properties.length]);

  useEffect(() => {
    fetchPropertiesRef.current = fetchProperties;
  }, [fetchProperties]);
  
  const setupRealtimeSubscription = useCallback(() => {
    const subscriptionId = `properties-${Date.now()}`;
    
    if (subscriptionRef.current) {
      try {
        console.log('إلغاء الاشتراك الحالي قبل إنشاء اشتراك جديد...');
        supabase.removeChannel(subscriptionRef.current);
      } catch (e) {
        console.error('Error removing existing channel:', e);
      }
      subscriptionRef.current = null;
    }
    
    if (!currentUser || currentUser.role !== 'admin') {
      console.log('تخطي الاشتراك في التغييرات الفورية: المستخدم ليس مسؤولاً');
      return;
    }
    
    try {
      console.log(`إنشاء اشتراك جديد للتغييرات الفورية (${subscriptionId})...`);
      
      const channel = supabase.channel(subscriptionId);
      
      subscriptionRef.current = channel
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'properties' 
        }, (payload) => {
          console.log('Realtime update received:', payload.eventType);
          
          try {
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as PropertiesRow;
              
              const newProperty: Property = {
                id: newItem.id,
                name: newItem.name || "عقار بدون اسم",
                location: newItem.location || "",
                rooms: newItem.rooms || 1,
                bathrooms: newItem.bathrooms || 1,
                size: newItem.size || 0,
                beds: newItem.beds || 1,
                price: newItem.price || 0,
                discount: newItem.discount || 0,
                property_type: (newItem.property_type || 'شقة') as PropertyType,
                status: (newItem.status || 'للإيجار') as PropertyStatus,
                amenities: newItem.amenities || [],
                images: newItem.images || [],
                description: newItem.description || "",
                available: newItem.available === undefined ? true : newItem.available,
                createdAt: newItem.created_at || new Date().toISOString(),
                updatedAt: newItem.updated_at || new Date().toISOString(),
                residential_unit_type: newItem.residential_unit_type as ResidentialUnitType,
                housing_category: newItem.housing_category as HousingCategory,
                area_type: newItem.area_type as AreaType,
                special_property_type: (newItem.special_property_type || 'عادي') as SpecialPropertyType,
              };
              
              setProperties(prev => {
                const updated = [...prev, newProperty];
                localStorage.setItem('cached_properties', JSON.stringify(updated));
                return updated;
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedItem = payload.new as PropertiesRow;
              
              setProperties(prev => {
                const updated = prev.map(p => p.id === updatedItem.id 
                  ? {
                      id: updatedItem.id,
                      name: updatedItem.name || "عقار بدون اسم",
                      location: updatedItem.location || "",
                      rooms: updatedItem.rooms || 1,
                      bathrooms: updatedItem.bathrooms || 1,
                      size: updatedItem.size || 0,
                      beds: updatedItem.beds || 1,
                      price: updatedItem.price || 0,
                      discount: updatedItem.discount || 0,
                      property_type: (updatedItem.property_type || 'شقة') as PropertyType,
                      status: (updatedItem.status || 'للإيجار') as PropertyStatus,
                      amenities: updatedItem.amenities || [],
                      images: updatedItem.images || [],
                      description: updatedItem.description || "",
                      available: updatedItem.available === undefined ? true : updatedItem.available,
                      createdAt: updatedItem.created_at || new Date().toISOString(),
                      updatedAt: updatedItem.updated_at || new Date().toISOString(),
                      residential_unit_type: updatedItem.residential_unit_type as ResidentialUnitType,
                      housing_category: updatedItem.housing_category as HousingCategory,
                      area_type: updatedItem.area_type as AreaType,
                      special_property_type: (updatedItem.special_property_type || 'عادي') as SpecialPropertyType,
                    } 
                  : p);
                
                localStorage.setItem('cached_properties', JSON.stringify(updated));
                return updated;
              });
            } else if (payload.eventType === 'DELETE') {
              const oldItem = payload.old as PropertiesRow;
              setProperties(prev => {
                const updated = prev.filter(p => p.id !== oldItem.id);
                localStorage.setItem('cached_properties', JSON.stringify(updated));
                return updated;
              });
            }
            
            setLastFetchTime(Date.now());
          } catch (error) {
            console.error('Error processing realtime update:', error);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`تم الاشتراك بنجاح في التغييرات الفورية (${subscriptionId})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('إلغاء الاشتراك تلقائيًا بعد 30 دقيقة');
              if (subscriptionRef.current) {
                try {
                  supabase.removeChannel(subscriptionRef.current);
                  subscriptionRef.current = null;
                } catch (e) {
                  console.error('Error during auto-unsubscribe:', e);
                }
              }
            }, 30 * 60 * 1000);
            
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.error(`خطأ في اشتراك التغييرات الفورية (${subscriptionId}): ${status}`);
            if (subscriptionRef.current) {
              subscriptionRef.current = null;
            }
          }
        });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  }, [currentUser]);
  
  useEffect(() => {
    let isInitialMount = true;
    let hasLoadedData = false;
    
    const cachedData = localStorage.getItem('cached_properties');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setProperties(parsed);
        setIsLoading(false);
        hasLoadedData = true;
        console.log('Loaded cached properties for immediate display');
      } catch (e) {
        console.error('Error parsing cached data:', e);
      }
    }
    
    const initialLoadTimeout = setTimeout(() => {
      fetchProperties();
      
      const subscriptionTimeout = setTimeout(() => {
        if (currentUser && currentUser.role === 'admin') {
          setupRealtimeSubscription();
        } else {
          console.log('تخطي إعداد الاشتراك في التغييرات الفورية: المستخدم ليس مسؤولاً');
        }
      }, 5000);
      
      return () => clearTimeout(subscriptionTimeout);
    }, 2000);
    
    let ignoreAutoRefresh = false;
    
    const dataRefreshInterval = setInterval(() => {
      if (ignoreAutoRefresh) return;
      
      if (!currentUser) {
        console.log('تخطي التحديث التلقائي: المستخدم غير مسجل الدخول');
        return;
      }
      
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      
      if (timeSinceLastFetch > 600000 && fetchPropertiesRef.current) {
        if (properties.length === 0 && hasLoadedData) {
          console.log('تخطي التحديث التلقائي: لا توجد عقارات ولا داعي لإعادة التحميل');
          ignoreAutoRefresh = true;
          return;
        }
        
        fetchPropertiesRef.current(false);
      }
    }, 600000);
      
    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up realtime subscription');
        try {
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        } catch (e) {
          console.error('Error removing channel during cleanup:', e);
        }
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      clearTimeout(initialLoadTimeout);
      clearInterval(dataRefreshInterval);
    };
  }, [currentUser]);
  
  const addProperty = async (propertyData: {
    name: string;
    location: string;
    rooms: number;
    beds: number;
    price: number;
    discount: number;
    property_type: PropertyType;
    status: PropertyStatus;
    amenities: string[];
    images: string[];
    description: string;
    available: boolean;
    residential_unit_type?: ResidentialUnitType;
    housing_category?: HousingCategory;
    area_type?: AreaType;
    special_property_type?: SpecialPropertyType;
    bathrooms?: number;
    size?: number;
  }) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast.error("يجب تسجيل الدخول كمسؤول لإضافة عقار جديد");
      return false;
    }

    try {
      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();

      // تجهيز البيانات للإرسال لقاعدة البيانات
      const insertData = {
        name: propertyData.name.trim(),
        location: propertyData.location.trim(),
        rooms: propertyData.rooms,
        beds: propertyData.beds,
        bathrooms: propertyData.bathrooms || 1,
        size: propertyData.size || 0,
        price: propertyData.price,
        discount: propertyData.discount || 0,
        property_type: propertyData.property_type,
        status: propertyData.status,
        amenities: propertyData.amenities || [],
        images: propertyData.images || [],
        description: propertyData.description?.trim() || '',
        available: propertyData.available,
        residential_unit_type: propertyData.residential_unit_type || null,
        housing_category: propertyData.housing_category || null,
        area_type: propertyData.area_type || null,
        special_property_type: propertyData.special_property_type || 'عادي',
        created_by: currentUser.id,
        created_at: now,
        updated_at: now
      };

      // تحديث مؤقت في الواجهة
      setProperties(prev => [{
        ...insertData,
        id: tempId,
        createdAt: now,
        updatedAt: now
      } as Property, ...prev]);

      // إرسال البيانات إلى قاعدة البيانات
      const { data, error } = await supabase
        .from('properties')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        // التراجع عن التحديث المؤقت في حالة الخطأ
        setProperties(prev => prev.filter(p => p.id !== tempId));
        console.error('Error adding property:', error);
        toast.error(error.message);
        return false;
      }

      // تحديث البيانات في الواجهة بالبيانات الفعلية من قاعدة البيانات
      setProperties(prev => 
        prev.map(p => p.id === tempId ? {
          ...p,
          id: data.id,
          created_at: data.created_at,
          updated_at: data.updated_at,
        } : p)
      );

      toast.success('تم إضافة العقار بنجاح');
      return true;

    } catch (error: any) {
      console.error('Error in addProperty:', error);
      toast.error(error.message || 'حدث خطأ غير متوقع');
      return false;
    }
  };

  const updateProperty = async (id: string, propertyData: Partial<Property>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('ليس لديك صلاحية لتعديل العقار');
    }

    try {
      const propertyToUpdate = properties.find(p => p.id === id);
      if (!propertyToUpdate) {
        throw new Error('العقار غير موجود');
      }

      // تجهيز البيانات للإرسال
      const updateData = {
        name: propertyData.name?.trim(),
        location: propertyData.location?.trim(),
        rooms: propertyData.rooms,
        beds: propertyData.beds,
        price: propertyData.price,
        discount: propertyData.discount,
        property_type: propertyData.property_type,
        status: propertyData.status,
        amenities: propertyData.amenities,
        images: propertyData.images,
        description: propertyData.description?.trim(),
        available: propertyData.available,
        residential_unit_type: propertyData.residential_unit_type,
        housing_category: propertyData.housing_category,
        area_type: propertyData.area_type,
        special_property_type: propertyData.special_property_type || 'عادي',
        updated_at: new Date().toISOString()
      };

      // تحديث في قاعدة البيانات
      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating property:', error);
        throw new Error(error.message || 'حدث خطأ أثناء تعديل العقار');
      }

      // تحديث في واجهة المستخدم
      setProperties(prev => prev.map(p => p.id === id 
        ? {
          ...p,
          ...propertyData,
          updatedAt: new Date().toISOString()
        }
        : p
      ));

      return true;
    } catch (error) {
      console.error('Error in updateProperty:', error);
      throw error;
    }
  };

  const deleteProperty = async (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('ليس لديك صلاحية لحذف العقار');
    }
    
    try {
      const propertyToDelete = properties.find(p => p.id === id);
      
      if (!propertyToDelete) {
        throw new Error('العقار غير موجود');
      }
      
      setProperties(prev => prev.filter(p => p.id !== id));
      
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
        
      if (error) {
        setProperties(prev => [...prev, propertyToDelete]);
        throw error;
      }
      
      toast.success('تم حذف العقار بنجاح');
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error(error.message || 'حدث خطأ أثناء حذف العقار');
    }
  };

  const duplicateProperty = async (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('ليس لديك صلاحية لتكرار العقار');
    }

    try {
      const propertyToDuplicate = properties.find((p) => p.id === id);
      if (!propertyToDuplicate) {
        throw new Error("العقار غير موجود");
      }

      const {
        id: _,
        createdAt: __,
        updatedAt: ___,
        ...propertyData
      } = propertyToDuplicate;

      const newPropertyName = `${propertyData.name} (نسخة)`;

      const tempId = `temp-${Date.now()}`;
      const now = new Date().toISOString();
      
      const tempProperty: Property = {
        id: tempId,
        ...propertyData,
        name: newPropertyName,
        createdAt: now,
        updatedAt: now,
        residential_unit_type: propertyData.residential_unit_type,
        housing_category: propertyData.housing_category,
        area_type: propertyData.area_type,
        special_property_type: propertyData.special_property_type || 'عادي',
      };
      
      setProperties(prev => [...prev, tempProperty]);

      const { data, error } = await supabase
        .from('properties')
        .insert([{
          name: newPropertyName,
          location: propertyData.location,
          rooms: propertyData.rooms,
          bathrooms: propertyData.bathrooms,
          size: propertyData.size,
          beds: propertyData.beds,
          price: propertyData.price,
          discount: propertyData.discount,
          property_type: propertyData.property_type,
          status: propertyData.status,
          amenities: propertyData.amenities,
          images: propertyData.images,
          description: propertyData.description,
          available: propertyData.available,
          residential_unit_type: propertyData.residential_unit_type,
          housing_category: propertyData.housing_category,
          area_type: propertyData.area_type,
          special_property_type: propertyData.special_property_type || 'عادي',
        }])
        .select()
        .single();

      if (error) {
        setProperties(prev => prev.filter(p => p.id !== tempId));
        throw error;
      }

      if (data) {
        const newProperty = {
          id: data.id,
          name: data.name,
          location: data.location,
          rooms: data.rooms,
          bathrooms: data.bathrooms || 1,
          size: data.size || 0,
          beds: data.beds || 1,
          price: data.price || 0,
          discount: data.discount || 0,
          property_type: data.property_type as PropertyType,
          status: data.status as PropertyStatus,
          amenities: data.amenities || [],
          images: data.images || [],
          description: data.description || "",
          available: data.available,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          residential_unit_type: (data as any).residential_unit_type as ResidentialUnitType,
          housing_category: (data as any).housing_category as HousingCategory,
          area_type: (data as any).area_type as AreaType,
          special_property_type: ((data as any).special_property_type || 'عادي') as SpecialPropertyType,
        };

        setProperties(prev => 
          prev.map(p => p.id === tempId ? newProperty : p)
        );
        
        await fetchProperties();
      }
    } catch (error: any) {
      console.error('Error duplicating property:', error);
      throw new Error(error.message || 'حدث خطأ أثناء تكرار العقار');
    }
  };

  const getPropertyById = async (id: string): Promise<Property | null> => {
    try {
      // أولاً، نبحث في قائمة العقارات المحملة مسبقًا في الذاكرة
      console.log('Searching for property in memory first, ID:', id);
      const propertyInMemory = properties.find(p => p.id === id);
      
      if (propertyInMemory) {
        console.log('Found property in memory:', propertyInMemory);
        return propertyInMemory;
      }
      
      console.log('Property not found in memory, fetching from database...');
      
      // إذا لم نجد العقار في الذاكرة، نقوم بجلبه من قاعدة البيانات
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching property from database:', error);
        throw error;
      }
      
      if (!data) {
        console.log('Property not found in database');
        return null;
      }

      console.log('Found property in database:', data);
      
      const property = {
        id: data.id,
        name: data.name || "عقار بدون اسم",
        location: data.location || "",
        rooms: data.rooms || 1,
        bathrooms: data.bathrooms || 1,
        size: data.size || 0,
        beds: data.beds || 1,
        price: data.price || 0,
        discount: data.discount || 0,
        property_type: (data.property_type || 'شقة') as PropertyType,
        status: (data.status || 'للإيجار') as PropertyStatus,
        amenities: data.amenities || [],
        images: data.images || [],
        description: data.description || "",
        available: data.available === undefined ? true : data.available,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
        residential_unit_type: data.residential_unit_type as ResidentialUnitType,
        housing_category: data.housing_category as HousingCategory,
        area_type: data.area_type as AreaType,
        special_property_type: (data.special_property_type || 'عادي') as SpecialPropertyType,
      };
      
      // إضافة العقار إلى قائمة العقارات في الذاكرة إذا لم يكن موجودًا
      setProperties(prev => {
        if (!prev.some(p => p.id === property.id)) {
          return [...prev, property];
        }
        return prev;
      });
      
      return property;
    } catch (error) {
      console.error('Error in getPropertyById:', error);
      
      // في حالة الخطأ، نحاول البحث مرة أخرى في الذاكرة
      const fallbackProperty = properties.find(p => p.id === id);
      if (fallbackProperty) {
        console.log('Fallback: Found property in memory after error:', fallbackProperty);
        return fallbackProperty;
      }
      
      return null;
    }
  };

  const contextValue: PropertiesContextType = {
    properties,
    addProperty,
    updateProperty,
    deleteProperty,
    duplicateProperty,
    isLoading,
    getPropertyById
  };

  return <PropertiesContext.Provider value={contextValue}>{children}</PropertiesContext.Provider>;
};

export const useProperties = () => {
  const context = useContext(PropertiesContext);
  if (context === undefined) {
    throw new Error('useProperties must be used within a PropertiesProvider');
  }
  return context;
};
