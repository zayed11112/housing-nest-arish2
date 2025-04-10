import React from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Bed, 
  Hotel, 
  Building, 
  MapPin, 
  Star, 
  Users, 
  UserCircle2,
  Palmtree,
  Sparkles,
  BadgePercent,
  Crown
} from "lucide-react";
import { toast } from "sonner";

// تعديل تعريف الفئات مع قيم أكثر مطابقة لتلك الموجودة في نوع ResidentialUnitType
const residentialUnits = [
  { id: "أوضة سنجل", name: "أوضة سنجل", icon: <Bed className="h-8 w-8" />, color: "bg-rose-500" },
  { id: "أوضة دابل", name: "أوضة دابل", icon: <Hotel className="h-8 w-8" />, color: "bg-blue-500" },
  { id: "شقة غرفتين", name: "شقة غرفتين", icon: <Home className="h-8 w-8" />, color: "bg-emerald-500" },
  { id: "شقة ثلاث غرف", name: "شقة ثلاث غرف", icon: <Building className="h-8 w-8" />, color: "bg-violet-500" },
  { id: "استوديو", name: "استوديو", icon: <Home className="h-8 w-8" />, color: "bg-amber-500" },
];

// تعديل تعريف الفئات مع قيم أكثر مطابقة لتلك الموجودة في نوع HousingCategory
const housingCategories = [
  { id: "بنات", name: "بنات", icon: <UserCircle2 className="h-8 w-8" />, color: "bg-pink-500" },
  { id: "اولاد", name: "اولاد", icon: <Users className="h-8 w-8" />, color: "bg-indigo-500" },
  { id: "مصيف", name: "مصيف", icon: <Palmtree className="h-8 w-8" />, color: "bg-cyan-500" },
];

// تعديل تعريف الفئات مع قيم أكثر مطابقة لتلك الموجودة في نوع AreaType
const areaTypes = [
  { id: "المساعيد", name: "المساعيد", icon: <MapPin className="h-8 w-8" />, color: "bg-sky-500" },
  { id: "الاداري", name: "الاداري", icon: <Building className="h-8 w-8" />, color: "bg-purple-500" },
  { id: "برادا", name: "برادا", icon: <Star className="h-8 w-8" />, color: "bg-green-500" },
  { id: "قرية سما", name: "قرية سما", icon: <MapPin className="h-8 w-8" />, color: "bg-orange-500" },
];

// تعديل تعريف الفئات مع قيم أكثر مطابقة لتلك الموجودة في نوع SpecialPropertyType
const specialPropertyTypes = [
  { id: "شقق لقطة", name: "شقق لقطة", icon: <BadgePercent className="h-8 w-8" />, color: "bg-amber-500" },
  { id: "عروض شركة السهم", name: "عروض شركة السهم", icon: <Sparkles className="h-8 w-8" />, color: "bg-blue-500" },
  { id: "شقق VIP", name: "شقق VIP", icon: <Crown className="h-8 w-8" />, color: "bg-violet-500" },
];

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  
  console.log('CategoriesPage rendering');

  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    return (
      <AppLayout title="التصنيفات" hideBottomNav={false}>
        <div className="flex flex-col items-center justify-center p-4">
          <p className="text-red-500 mb-4">حدث خطأ: {error.message}</p>
          <Button onClick={() => window.location.reload()}>إعادة تحميل الصفحة</Button>
        </div>
      </AppLayout>
    );
  }

  const handleCategoryClick = (type: string, value: string) => {
    try {
      console.log('Category clicked:', type, value);
      toast.success(`جاري البحث في ${value}`);
      
      console.log(`البحث باستخدام ${type}=${value}`);
      
      const encodedValue = encodeURIComponent(value);
      const params = new URLSearchParams();
      
      // Set all other parameters to "all" by default
      params.set("residential_unit_type", "all");
      params.set("housing_category", "all");
      params.set("area_type", "all");
      params.set("special_property_type", "all");
      
      // Override the selected parameter
      if (type === "unit") {
        params.set("residential_unit_type", encodedValue);
      } else if (type === "category") {
        params.set("housing_category", encodedValue);
      } else if (type === "area") {
        params.set("area_type", encodedValue);
      } else if (type === "special") {
        params.set("special_property_type", encodedValue);
      }
      
      navigate(`/search?${params.toString()}`);
    } catch (err) {
      console.error('Error handling category click:', err);
      setError(err instanceof Error ? err : new Error('حدث خطأ غير متوقع'));
    }
  };

  try {
    console.log('CategoriesPage before return');
    return (
      <AppLayout title="التصنيفات" hideBottomNav={false}>
        <div className="space-y-8 mb-20">
          {/* أنواع الوحدات السكنية */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Home className="ml-2 h-5 w-5" />
              أنواع الوحدات السكنية
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {residentialUnits.map((unit) => (
                <Button
                  key={unit.id}
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-lg border-2 hover:scale-[1.02] transition-transform"
                  onClick={() => handleCategoryClick("unit", unit.id)}
                >
                  <div className={`${unit.color} text-white p-3 rounded-full mb-2`}>
                    {unit.icon}
                  </div>
                  <span>{unit.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* فئات الإسكان */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Users className="ml-2 h-5 w-5" />
              فئات الإسكان
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {housingCategories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-lg border-2 hover:scale-[1.02] transition-transform"
                  onClick={() => handleCategoryClick("category", category.id)}
                >
                  <div className={`${category.color} text-white p-3 rounded-full mb-2`}>
                    {category.icon}
                  </div>
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* المناطق والمشاريع */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <MapPin className="ml-2 h-5 w-5" />
              المناطق والمشاريع
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {areaTypes.map((area) => (
                <Button
                  key={area.id}
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-lg border-2 hover:scale-[1.02] transition-transform"
                  onClick={() => handleCategoryClick("area", area.id)}
                >
                  <div className={`${area.color} text-white p-3 rounded-full mb-2`}>
                    {area.icon}
                  </div>
                  <span>{area.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* أنواع العقارات الخاصة */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Star className="ml-2 h-5 w-5" />
              أنواع العقارات الخاصة
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {specialPropertyTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-lg border-2 hover:scale-[1.02] transition-transform"
                  onClick={() => handleCategoryClick("special", type.id)}
                >
                  <div className={`${type.color} text-white p-3 rounded-full mb-2`}>
                    {type.icon}
                  </div>
                  <span>{type.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  } catch (err) {
    console.error('Error rendering CategoriesPage:', err);
    setError(err instanceof Error ? err : new Error('حدث خطأ غير متوقع'));
    return null;
  }
};

export default CategoriesPage;