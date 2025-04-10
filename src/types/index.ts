// Ensure 'user' is included if it's used, or adjust AuthContext logic
export type UserRole = 'user' | 'admin' | 'guest' | 'student'; // Added 'user' and 'student' for clarity
export type UserStatus = 'active' | 'banned'; 

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  faculty?: Faculty;
  batch?: string;
  student_id?: string;
  createdAt: string;
  photoURL?: string;
}

export type Faculty = 
  | 'كلية طب الأسنان – Dentistry (DENT)'
  | 'كلية الصيدلة – Pharmacy (PHAR)'
  | 'كلية الهندسة – Engineering (ENG)'
  | 'كلية تكنولوجيا المعلومات وعلوم الحاسب – Computer Science (CS)'
  | 'كلية إدارة الأعمال – Business Administration (BA)'
  | 'كلية الإعلام – Mass Communication (MC)'
  | 'أخرى';

export type PropertyType = 'شقة' | 'غرفة' | 'سرير' | 'فيلا' | 'شاليه' | 'استوديو';
export type PropertyStatus = 'للإيجار' | 'للبيع' | 'للمصيف';

// أنواع الوحدات السكنية
export type ResidentialUnitType = 
  | 'أوضة سنجل'
  | 'أوضة دابل'
  | 'شقة غرفتين'
  | 'شقة ثلاث غرف'
  | 'استوديو';

// فئات الإسكان
export type HousingCategory = 
  | 'بنات'
  | 'اولاد'
  | 'مصيف'
  | 'عائلات';

// المناطق والمشاريع
export type AreaType = 
  | 'المساعيد'
  | 'الاداري'
  | 'برادا'
  | 'قرية سما'
  | 'أخرى';

// أنواع العقارات الخاصة
export type SpecialPropertyType = 
  | 'شقق لقطة'
  | 'عروض شركة السهم'
  | 'شقق VIP'
  | 'عادي';

export interface Property {
  id: string;
  name: string;
  location: string;
  rooms: number;
  bathrooms: number; // موجود في قاعدة البيانات ولكن سيتم تجاهله في الواجهة
  size: number; // موجود في قاعدة البيانات ولكن سيتم تجاهله في الواجهة
  beds: number; // عدد الأسرة
  price: number;
  discount?: number; // الخصم
  property_type: PropertyType; // نوع العقار
  status: PropertyStatus; // حالة العقار (للبيع، للإيجار، للمصيف)
  amenities: string[];
  images: string[];
  description: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
  // التصنيفات الجديدة
  residential_unit_type?: ResidentialUnitType; // نوع الوحدة السكنية
  housing_category?: HousingCategory; // فئة الإسكان (بنات/اولاد/مصيف)
  area_type?: AreaType; // المنطقة
  special_property_type?: SpecialPropertyType; // نوع العقار الخاص
}

export interface BookingRequest {
  id: string;
  propertyId: string;
  property?: Property;
  userId: string;
  user?: User;
  fullName: string;
  faculty: string;
  batch: string;
  phone: string;
  alternativePhone?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  propertyId: string;
  property?: Property;
  userId: string;
}
