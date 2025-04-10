
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { PropertiesProvider, useProperties } from './PropertiesContext';
import { BookingsProvider, useBookings } from './BookingsContext';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { SettingsProvider, useSettings } from './SettingsContext';
import { ChatProvider, useChat } from './ChatContext'; // Import Chat context
import { ThemeProvider } from './ThemeContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider> {/* Move ThemeProvider higher */}
        <SettingsProvider> {/* SettingsProvider can be inside or outside, but ThemeProvider uses it */}
          <PropertiesProvider>
            <BookingsProvider>
              <FavoritesProvider>
                <ChatProvider> {/* Wrap with ChatProvider */}
                  {children}
                </ChatProvider>
              </FavoritesProvider>
            </BookingsProvider>
          </PropertiesProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

// Modified useApp hook to return individual contexts
export const useApp = () => {
  const auth = useAuth();
  const properties = useProperties();
  const bookings = useBookings();
  const favorites = useFavorites();
  const settings = useSettings();
  const chat = useChat(); // Use chat hook

  // Calculate combined loading state
  const isLoading = auth.isLoading || 
                    properties.isLoading || 
                    bookings.isLoading || 
                    favorites.isLoading ||
                    settings.isLoading ||
                    chat.isLoadingMessages; // Include chat loading state

  // Return contexts individually instead of spreading
  return {
    auth,
    properties,
    bookings,
    favorites,
    settings,
    chat, // Add chat context
    isLoading
  };
};
