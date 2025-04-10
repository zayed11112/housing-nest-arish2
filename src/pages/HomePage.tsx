import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PropertyCard from "@/components/PropertyCard";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext"; // Use the main hook
import { Search, Building, MapPin, ArrowRight, Star, Shield, LayoutGrid, Bed, UserCircle2, Crown, AlertCircle, Phone, MessageCircle, ExternalLink, PlusCircle, LayoutDashboard } from "lucide-react";
import { Property, PropertyType, PropertyStatus } from "@/types";
// Remove direct context imports if useApp provides them
// import { useProperties } from "@/contexts/PropertiesContext"; 
// import { useAuth } from "@/contexts/AuthContext";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  // Destructure contexts from useApp
  const { auth, properties: propertiesContext, isLoading } = useApp(); 
  const { currentUser, isConnected } = auth; // Get currentUser and isConnected from auth context
  const { properties } = propertiesContext; // Get properties from properties context
  
  const [isAnimated, setIsAnimated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  
  // استخدام useMemo بدلاً من useEffect + useState لتحسين الأداء
  const filteredProperties = useMemo(() => {
    if (!properties || !Array.isArray(properties)) return [];
    
    // تأكد من صحة البنية قبل الفلترة
    return properties
      .filter(p => p && typeof p === 'object' && p.available === true)
      .slice(0, 3); // زيادة عدد العقارات المعروضة للتنوع
  }, [properties]);

  // تطبيق تأثير التلاشي بعد تحميل الصفحة
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // التحقق من وجود بيانات للعرض وهناك حالة تحميل
  // const shouldShowConnectionError = !isConnected && properties.length === 0; // Use isConnected from auth context directly
  const hasPropertiesToShow = filteredProperties.length > 0;

  // دوال التواصل
  const handlePhoneCall = () => {
    window.open('tel:+201093130120');
  };
  
  const handleWhatsApp = () => {
    window.open('https://wa.me/201093130120');
  };
  
  const handleWebsite = () => {
    window.open('https://www.facebook.com/eslamz11/');
  };
  
  // معالجة البحث للمستقبل (الوظيفة غير مطبقة حاليًا في سياق العقارات)
  const handleSearch = () => {
    // استخدام إعادة التوجيه إلى صفحة البحث مع المعلمات
    navigate(`/search?query=${encodeURIComponent(searchQuery)}&type=${encodeURIComponent(selectedType)}&status=${encodeURIComponent(selectedStatus)}`);
  };

  return (
    <AppLayout title="الصفحة الرئيسية">
      <div className="container mx-auto px-4 py-8">
        {/* قسم ترحيبي للمسؤول */}
        {currentUser && currentUser.role === "admin" && ( // Use currentUser from useApp().auth
          <div className="mb-8 bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">مرحباً بك يا مدير</h2> {/* Changed title */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/properties")}
              >
                عرض جميع العقارات
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center py-6 h-auto border-primary/30 hover:bg-primary/5"
                onClick={() => navigate("/admin/properties/add")}
              >
                <PlusCircle className="h-6 w-6 mb-2 text-primary" />
                <span className="text-sm font-medium">إضافة عقار جديد</span>
              </Button>
              
              {/* Changed Button: Dashboard -> Chats */}
              <Button
                variant="outline"
                className="flex flex-col items-center py-6 h-auto border-primary/30 hover:bg-primary/5"
                onClick={() => navigate("/admin/chats")} // Navigate to new admin chats list page
              >
                <MessageCircle className="h-6 w-6 mb-2 text-primary" /> {/* Changed Icon */}
                <span className="text-sm font-medium">الشاتات</span> {/* Changed Text */}
              </Button>
            </div>
          </div>
        )}

        {/* قسم البحث */}
        <div className="mb-6">
          <Button
            variant="outline"
            className="w-full h-12 bg-card flex justify-start border-2 border-border"
            onClick={() => navigate("/search")}
          >
            <div className="flex items-center">
              <Search className="text-muted-foreground h-5 w-5 ml-2" />
              <span className="text-muted-foreground">ابحث عن السكن المناسب ...</span>
            </div>
          </Button>
        </div>

        {/* شريط مشكلة الاتصال */}
        {!isConnected && ( // Simplified connection check
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 ml-2" />
            <div>
              <p className="text-amber-700 text-sm">
                يبدو أن هناك مشكلة في الاتصال. نحاول إعادة الاتصال...
              </p>
            </div>
          </div>
        )}

        {/* قسم التصنيفات */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center">
              <LayoutGrid className="mr-2 h-5 w-5" />
              تصفح حسب الفئات
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => navigate("/categories")}
            >
              عرض الكل
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-5 flex flex-col items-center justify-center border-2"
              onClick={() => navigate("/search?unit=single-room")}
            >
              <div className="bg-rose-500 text-white p-3 rounded-full mb-2">
                <Bed className="h-6 w-6" />
              </div>
              <span>أوضة سنجل</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-5 flex flex-col items-center justify-center border-2"
              onClick={() => navigate("/search?area=masaeed")}
            >
              <div className="bg-sky-500 text-white p-3 rounded-full mb-2">
                <MapPin className="h-6 w-6" />
              </div>
              <span>منطقة المساعيد</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-5 flex flex-col items-center justify-center border-2"
              onClick={() => navigate("/search?category=girls")}
            >
              <div className="bg-pink-500 text-white p-3 rounded-full mb-2">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <span>سكن بنات</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-5 flex flex-col items-center justify-center border-2"
              onClick={() => navigate("/search?special=vip")}
            >
              <div className="bg-violet-500 text-white p-3 rounded-full mb-2">
                <Crown className="h-6 w-6" />
              </div>
              <span>شقق VIP</span>
            </Button>
          </div>
        </div>

        {/* أحدث العقارات */}
        <section className="mb-8">
          <div className="pb-4">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Star className="h-5 w-5 text-primary ml-1" />
              أحدث العقارات
            </h2>
            
            {isLoading && !hasPropertiesToShow ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : hasPropertiesToShow ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-lg">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">لا توجد عقارات متاحة حالياً</p>
              </div>
            )}
            
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => navigate("/search")}
                className="flex items-center gap-2"
              >
                عرض كل العقارات
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* اتصل بنا */}
        <section className="mb-16">
          <div className="pb-4">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Shield className="h-5 w-5 text-primary ml-1" />
              اتصل بنا
            </h2>
            
            <div className="bg-card border border-border shadow-sm rounded-lg p-4">
              <div className="text-center">
                <img
                  src="https://blogger.googleusercontent.com/img/a/AVvXsEivxLtY2MuWlNm1tYiquIFfYXHYCW23bhOa8Kz3oeKY3Xbaf4XRAbmoLXNBX7l18B4uGCqSY8wLF62P_SqNefuM8PBUDNXpAhfwMeV3IjRZ7hlxyROSZUcfPiPkRkt03hh6QlVy-dAzRhK5Zq_L0NrNRyHQcU6aJoXDFG_DEbJK6KYSMZ975xTH6gl1DCg=w1920-h569-p-k-no-nu"
                  alt="شركة السهم للتسكين"
                  className="h-16 mx-auto object-contain mb-4"
                />
                <h3 className="font-bold mb-2"> تم التصميم / مهندس اسلام زايد  </h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  نوفر أفضل خيارات السكن للطلاب والعائلات في العريش
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handlePhoneCall}
                  >
                    <Phone className="h-5 w-5 text-green-600" />
                    <span>اتصل الآن: 01093130120</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span>واتساب: 01093130120</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleWebsite}
                  >
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <span>الفيس بوك الخاص بالمصمم</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default HomePage;
