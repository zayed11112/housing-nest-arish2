import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PropertyCard from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter, 
  Building,
  Home,
  MapPin,
  Users,
  Star
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext"; // Use main hook
import { 
  Property, 
  ResidentialUnitType, 
  HousingCategory, 
  AreaType,
  SpecialPropertyType 
} from "@/types";
import { Badge } from "@/components/ui/badge";

// تعريف قوائم القيم للتصنيفات
const residentialUnitOptions = [
  { value: "all", label: "الكل" },
  { value: "أوضة سنجل", label: "أوضة سنجل" },
  { value: "أوضة دابل", label: "أوضة دابل" },
  { value: "شقة غرفتين", label: "شقة غرفتين" },
  { value: "شقة ثلاث غرف", label: "شقة ثلاث غرف" },
  { value: "استوديو", label: "استوديو" },
];

const housingCategoryOptions = [
  { value: "all", label: "الكل" },
  { value: "بنات", label: "بنات" },
  { value: "اولاد", label: "اولاد" },
  { value: "مصيف", label: "مصيف" },
  { value: "عائلات", label: "عائلات" },
];

const areaTypeOptions = [
  { value: "all", label: "الكل" },
  { value: "المساعيد", label: "المساعيد" },
  { value: "الاداري", label: "الاداري" },
  { value: "برادا", label: "برادا" },
  { value: "قرية سما", label: "قرية سما" },
  { value: "أخرى", label: "أخرى" },
];

const specialPropertyTypeOptions = [
  { value: "all", label: "الكل" },
  { value: "شقق لقطة", label: "شقق لقطة" },
  { value: "عروض شركة السهم", label: "عروض شركة السهم" },
  { value: "شقق VIP", label: "شقق VIP" },
];

// وظيفة تحويل معرّفات الفئات إلى قيم مقابلة
const mapUnitIdToValue = (id: string): string => {
  switch (id) {
    case "single-room": return "أوضة سنجل";
    case "double-room": return "أوضة دابل";
    case "two-bedroom": return "شقة غرفتين";
    case "three-bedroom": return "شقة ثلاث غرف";
    case "studio": return "استوديو";
    default: return "";
  }
};

const mapCategoryIdToValue = (id: string): string => {
  switch (id) {
    case "girls": return "بنات";
    case "boys": return "اولاد";
    case "summer": return "مصيف";
    default: return "";
  }
};

const mapAreaIdToValue = (id: string): string => {
  switch (id) {
    case "masaeed": return "المساعيد";
    case "edary": return "الاداري";
    case "prada": return "برادا";
    case "sama": return "قرية سما";
    default: return "";
  }
};

const mapSpecialIdToValue = (id: string): string => {
  switch (id) {
    case "bargain": return "شقق لقطة";
    case "sahm-offers": return "عروض شركة السهم";
    case "vip": return "شقق VIP";
    default: return "";
  }
};

const SearchPage: React.FC = () => {
  // Update to use refactored useApp
  const { properties: propertiesContext } = useApp(); 
  const { properties } = propertiesContext; // Destructure properties
  const [searchParams, setSearchParams] = useSearchParams();

  // استخلاص معلمات البحث مباشرة من عنوان URL
  const residentialUnitTypeParam = searchParams.get("residential_unit_type") || "";
  const housingCategoryParam = searchParams.get("housing_category") || "";
  const areaTypeParam = searchParams.get("area_type") || "";
  const specialPropertyTypeParam = searchParams.get("special_property_type") || "";
  
  // استخلاص معلمات الأقسام القديمة للتوافق مع الإصدارات السابقة 
  const unitParam = searchParams.get("unit") || "";
  const categoryParam = searchParams.get("category") || "";
  const areaParam = searchParams.get("area") || "";
  const specialParam = searchParams.get("special") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minRooms, setMinRooms] = useState(1);
  const [amenityFilters, setAmenityFilters] = useState<Record<string, boolean>>({
    WiFi: false,
    مياه: false,
    كهرباء: false,
    غاز: false,
    أثاث: false,
    تكييف: false,
  });

  // فلاتر التصنيفات الجديدة
  const [residentialUnitType, setResidentialUnitType] = useState<string>("all");
  const [housingCategory, setHousingCategory] = useState<string>("all");
  const [areaType, setAreaType] = useState<string>("all");
  const [specialPropertyType, setSpecialPropertyType] = useState<string>("all");

  // تطبيق فلاتر URL عند تحميل الصفحة
  useEffect(() => {
    // استخدام القيم المباشرة من عنوان URL إذا كانت موجودة
    if (residentialUnitTypeParam) {
      setResidentialUnitType(residentialUnitTypeParam === "" ? "all" : residentialUnitTypeParam);
      setShowFilters(true);
    } 
    else if (unitParam) {
      // التوافق مع الطريقة القديمة
      const mappedValue = mapUnitIdToValue(unitParam);
      setResidentialUnitType(mappedValue === "" ? "all" : mappedValue);
      setShowFilters(true);
    }
    
    if (housingCategoryParam) {
      setHousingCategory(housingCategoryParam === "" ? "all" : housingCategoryParam);
      setShowFilters(true);
    }
    else if (categoryParam) {
      const mappedValue = mapCategoryIdToValue(categoryParam);
      setHousingCategory(mappedValue === "" ? "all" : mappedValue);
      setShowFilters(true);
    }
    
    if (areaTypeParam) {
      setAreaType(areaTypeParam === "" ? "all" : areaTypeParam);
      setShowFilters(true);
    }
    else if (areaParam) {
      const mappedValue = mapAreaIdToValue(areaParam);
      setAreaType(mappedValue === "" ? "all" : mappedValue);
      setShowFilters(true);
    }
    
    if (specialPropertyTypeParam) {
      setSpecialPropertyType(specialPropertyTypeParam === "" ? "all" : specialPropertyTypeParam);
      setShowFilters(true);
    }
    else if (specialParam) {
      const mappedValue = mapSpecialIdToValue(specialParam);
      setSpecialPropertyType(mappedValue === "" ? "all" : mappedValue);
      setShowFilters(true);
    }
    
    console.log("معلمات البحث:", {
      residentialUnitType: residentialUnitTypeParam || mapUnitIdToValue(unitParam),
      housingCategory: housingCategoryParam || mapCategoryIdToValue(categoryParam),
      areaType: areaTypeParam || mapAreaIdToValue(areaParam),
      specialPropertyType: specialPropertyTypeParam || mapSpecialIdToValue(specialParam)
    });
  }, [
    unitParam, categoryParam, areaParam, specialParam,
    residentialUnitTypeParam, housingCategoryParam, areaTypeParam, specialPropertyTypeParam
  ]);

  // استخراج جميع المرافق الفريدة من العقارات
  const allAmenities = Array.from(
    new Set(properties.flatMap((property) => property.amenities))
  );

  const toggleAmenityFilter = (amenity: string) => {
    setAmenityFilters((prev) => ({
      ...prev,
      [amenity]: !prev[amenity],
    }));
  };

  // إزالة جميع الفلاتر
  const clearFilters = () => {
    setResidentialUnitType("all");
    setHousingCategory("all");
    setAreaType("all");
    setSpecialPropertyType("all");
    setPriceRange([0, 5000]);
    setMinRooms(1);
    setAmenityFilters(
      Object.fromEntries(allAmenities.map((amenity) => [amenity, false]))
    );
    
    // إزالة معلمات URL
    setSearchParams(new URLSearchParams());
  };

  // تطبيق الفلترة على العقارات
  const filteredProperties = properties.filter((property) => {
    // البحث النصي
    const matchesSearch =
      searchTerm === "" ||
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase());

    // فلتر السعر
    const matchesPrice =
      property.price >= priceRange[0] && property.price <= priceRange[1];

    // فلتر الغرف
    const matchesRooms = property.rooms >= minRooms;

    // فلتر المرافق
    const selectedAmenities = Object.entries(amenityFilters)
      .filter(([_, isSelected]) => isSelected)
      .map(([amenity]) => amenity);

    const matchesAmenities =
      selectedAmenities.length === 0 ||
      selectedAmenities.every((amenity) =>
        property.amenities.includes(amenity)
      );

    // فلاتر التصنيفات الجديدة
    const matchesResidentialUnit = 
      residentialUnitType === "" || 
      residentialUnitType === "all" || 
      property.residential_unit_type === residentialUnitType;

    const matchesHousingCategory = 
      housingCategory === "" || 
      housingCategory === "all" || 
      property.housing_category === housingCategory;

    const matchesAreaType = 
      areaType === "" || 
      areaType === "all" || 
      property.area_type === areaType;

    const matchesSpecialPropertyType = 
      specialPropertyType === "" || 
      specialPropertyType === "all" || 
      property.special_property_type === specialPropertyType;

    return (
      matchesSearch && 
      matchesPrice && 
      matchesRooms && 
      matchesAmenities && 
      matchesResidentialUnit && 
      matchesHousingCategory && 
      matchesAreaType && 
      matchesSpecialPropertyType
    );
  });

  // حساب عدد الفلاتر النشطة
  const activeFiltersCount = [
    residentialUnitType !== "all",
    housingCategory !== "all",
    areaType !== "all",
    specialPropertyType !== "all",
    minRooms > 1,
    Object.values(amenityFilters).some((value) => value),
    !(priceRange[0] === 0 && priceRange[1] === 5000)
  ].filter(Boolean).length;

  return (
    <AppLayout title="البحث" hideBottomNav={false}>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن سكن..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Filter className="h-4 w-4" />
          <span>
            {showFilters ? "إخفاء الفلاتر" : `الفلاتر ${activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}`}
          </span>
        </Button>

        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="mr-2"
          >
            إزالة الفلاتر
          </Button>
        )}
      </div>

      {/* عرض الفلاتر النشطة كشارات */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {residentialUnitType && (
            <Badge variant="secondary" className="pl-2 flex items-center gap-1">
              <Home className="h-3 w-3" /> {residentialUnitType}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 ml-1 hover:bg-transparent" 
                onClick={() => setResidentialUnitType("")}
              >
                ×
              </Button>
            </Badge>
          )}
          {housingCategory && (
            <Badge variant="secondary" className="pl-2 flex items-center gap-1">
              <Users className="h-3 w-3" /> {housingCategory}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 ml-1 hover:bg-transparent" 
                onClick={() => setHousingCategory("")}
              >
                ×
              </Button>
            </Badge>
          )}
          {areaType && (
            <Badge variant="secondary" className="pl-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {areaType}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 ml-1 hover:bg-transparent" 
                onClick={() => setAreaType("")}
              >
                ×
              </Button>
            </Badge>
          )}
          {specialPropertyType && (
            <Badge variant="secondary" className="pl-2 flex items-center gap-1">
              <Star className="h-3 w-3" /> {specialPropertyType}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 ml-1 hover:bg-transparent" 
                onClick={() => setSpecialPropertyType("")}
              >
                ×
              </Button>
            </Badge>
          )}
        </div>
      )}

      {showFilters && (
        <div className="bg-background border border-border rounded-lg p-4 mb-6 animate-fade-in">
          {/* التصنيفات */}
          <div className="mb-6 space-y-4">
            <div>
              <Label className="mb-2 block font-medium">نوع الوحدة السكنية</Label>
              <Select
                value={residentialUnitType}
                onValueChange={setResidentialUnitType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الوحدة السكنية" />
                </SelectTrigger>
                <SelectContent>
                  {residentialUnitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block font-medium">فئة الإسكان</Label>
              <Select
                value={housingCategory}
                onValueChange={setHousingCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة الإسكان" />
                </SelectTrigger>
                <SelectContent>
                  {housingCategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block font-medium">المنطقة</Label>
              <Select
                value={areaType}
                onValueChange={setAreaType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنطقة" />
                </SelectTrigger>
                <SelectContent>
                  {areaTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block font-medium">نوع العقار الخاص</Label>
              <Select
                value={specialPropertyType}
                onValueChange={setSpecialPropertyType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع العقار الخاص" />
                </SelectTrigger>
                <SelectContent>
                  {specialPropertyTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">السعر الشهري</h3>
            <Slider
              min={0}
              max={5000}
              step={100}
              value={priceRange}
              onValueChange={setPriceRange}
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{priceRange[0]} جنيه</span>
              <span>{priceRange[1]} جنيه</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">الحد الأدنى لعدد الغرف</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <Button
                  key={num}
                  variant={minRooms === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinRooms(num)}
                >
                  {num}+
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">المرافق</h3>
            <div className="grid grid-cols-2 gap-2">
              {allAmenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center space-x-2 space-x-reverse"
                >
                  <Switch
                    id={`amenity-${amenity}`}
                    checked={amenityFilters[amenity] || false}
                    onCheckedChange={() => toggleAmenityFilter(amenity)}
                  />
                  <Label htmlFor={`amenity-${amenity}`}>{amenity}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <h2 className="font-bold text-lg mb-4">
          تم العثور على {filteredProperties.length} عقار
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))
          ) : (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                لا توجد عقارات تطابق معايير البحث
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default SearchPage;
