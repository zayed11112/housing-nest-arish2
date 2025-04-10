import React from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  // Update to use refactored useApp
  const { favorites: favoritesContext, properties: propertiesContext, auth } = useApp(); 
  const { favorites } = favoritesContext; // Destructure favorites array
  const { properties } = propertiesContext; // Destructure properties array
  const { currentUser } = auth; // Destructure currentUser

  // Get full property details for favorites
  const favoriteProperties = favorites
    .map((favorite) => properties.find((p) => p.id === favorite.propertyId))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (!currentUser) {
    return (
      <AppLayout title="المفضلة" hideBottomNav={false}>
        <div className="flex flex-col items-center justify-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">قم بتسجيل الدخول لعرض المفضلة</h1>
          <p className="text-muted-foreground text-center mb-6">
            قم بتسجيل الدخول لحفظ العقارات المفضلة لديك والوصول إليها في أي وقت
          </p>
          <Button onClick={() => navigate("/login")}>تسجيل الدخول</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="" hideBottomNav={false}>
      {favoriteProperties.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {favoriteProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">لا توجد عقارات في المفضلة</h1>
          <p className="text-muted-foreground text-center mb-6">
            أضف عقارات إلى المفضلة للوصول إليها بسهولة لاحقاً
          </p>
          <Button onClick={() => navigate("/search")}>استعرض العقارات</Button>
        </div>
      )}
    </AppLayout>
  );
};

export default FavoritesPage;
