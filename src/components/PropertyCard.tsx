
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '@/types';
import { Heart, Bed, Home } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const navigate = useNavigate();
  // Update to use refactored useApp
  const { favorites: favoritesContext, auth } = useApp(); 
  const { isPropertyInFavorites, addToFavorites, removeFromFavorites } = favoritesContext;
  const { currentUser } = auth;
  
  const isFavorite = isPropertyInFavorites(property.id);
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (isFavorite) {
      removeFromFavorites(property.id);
    } else {
      addToFavorites(property.id);
    }
  };
  
  const handleCardClick = () => {
    navigate(`/property/${property.id}`);
  };

  // حساب السعر النهائي بعد الخصم
  const finalPrice = property.price - (property.discount || 0);
  const hasDiscount = property.discount && property.discount > 0;

  return (
    <div className="property-card animate-slide-in-bottom border border-border rounded-lg shadow-sm overflow-hidden bg-card hover:shadow-md transition-shadow" onClick={handleCardClick}>
      <div className="relative">
        <img
          src={property.images[0] || 'https://via.placeholder.com/400x300?text=صورة+غير+متوفرة'}
          alt={property.name}
          className="w-full h-48 object-cover"
        />
        
        {hasDiscount && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            خصم {property.discount} جنيه
          </Badge>
        )}

        <button
          className="absolute top-2 left-2 p-2 bg-white/80 rounded-full"
          onClick={handleFavoriteClick}
        >
          <Heart
            className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
          />
        </button>
        
        {!property.available && (
          <div className="absolute top-0 right-0 left-0 bottom-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              غير متاح
            </span>
          </div>
        )}
        
        <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <Badge className="bg-primary/90 text-xs">{property.property_type}</Badge>
          <Badge className="mr-1 bg-secondary/90 text-xs">{property.status}</Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{property.name}</h3>
        <p className="text-muted-foreground text-sm mb-2">{property.location}</p>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-sm">
            <span className="flex items-center mr-2">
              <Home className="h-4 w-4 ml-1" />
              {property.rooms} غرف
            </span>
            <span className="flex items-center">
              <Bed className="h-4 w-4 ml-1" />
              {property.beds} سرير
            </span>
          </div>
          <div className="text-left">
            {hasDiscount ? (
              <div>
                <span className="font-bold text-primary">{finalPrice} جنيه</span>
                <span className="text-xs text-muted-foreground line-through mr-1">
                  {property.price} جنيه
                </span>
              </div>
            ) : (
              <span className="font-bold text-primary">{property.price} جنيه</span>
            )}
            <span className="text-xs block">{property.status === 'للمصيف' ? '/يوم' : '/شهر'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {property.amenities.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
            >
              {amenity}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
              +{property.amenities.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
