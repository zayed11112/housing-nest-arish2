import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext'; // To check admin role

// Define the shape of a single setting
interface Setting {
  key: string;
  value: any; // Use 'any' for flexibility with jsonb, parse/validate as needed
  description?: string | null;
}

// Define the shape of the settings state (key-value map)
interface SettingsState {
  [key: string]: any;
}

// Define the context type
interface SettingsContextType {
  settings: SettingsState;
  isLoading: boolean;
  getSetting: (key: string, defaultValue?: any) => any;
  updateSetting: (key: string, value: any) => Promise<{ success: boolean; error?: any }>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>({});
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth(); // Get current user for role checks

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('settings').select('key, value');

      if (error) {
        console.error("Error fetching settings:", error);
        toast.error(`خطأ في جلب الإعدادات: ${error.message}`);
        throw error;
      }

      const fetchedSettings: SettingsState = {};
      if (data) {
        data.forEach(setting => {
          // Attempt to parse JSON value, fallback to raw value if parsing fails
          try {
            // Supabase might return JSONB as already parsed objects/strings
            fetchedSettings[setting.key] = typeof setting.value === 'string' && (setting.value.startsWith('{') || setting.value.startsWith('['))
              ? JSON.parse(setting.value)
              : setting.value;
             // Handle Supabase returning JSON strings like '"some string"'
             if (typeof fetchedSettings[setting.key] === 'string' && fetchedSettings[setting.key].startsWith('"') && fetchedSettings[setting.key].endsWith('"')) {
               fetchedSettings[setting.key] = fetchedSettings[setting.key].slice(1, -1);
             }
          } catch (e) {
            console.warn(`Failed to parse setting value for key "${setting.key}":`, setting.value, e);
            fetchedSettings[setting.key] = setting.value; // Use raw value on parse error
          }
        });
      }
      setSettings(fetchedSettings);
      console.log("Settings loaded:", fetchedSettings);

    } catch (error) {
      // Error already logged and toasted
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = (key: string, defaultValue: any = null): any => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  const updateSetting = async (key: string, value: any): Promise<{ success: boolean; error?: any }> => {
     if (currentUser?.role !== 'admin') {
      toast.error("غير مصرح لك بتحديث الإعدادات.");
      return { success: false, error: "Permission denied" };
    }
    setIsLoading(true); // Indicate loading during update
    try {
       // Ensure value is stringified if it's an object/array for jsonb storage
       const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;

      // Use upsert to insert if key doesn't exist, or update if it does
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value: valueToStore, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (error) {
        console.error(`Error updating setting "${key}":`, error);
        toast.error(`خطأ في تحديث الإعداد "${key}": ${error.message}`);
        return { success: false, error };
      }

      // Update local state immediately
      setSettings(prevSettings => ({
        ...prevSettings,
        [key]: value // Store the original value, not the stringified one
      }));

      toast.success(`تم تحديث الإعداد "${key}" بنجاح.`);
      return { success: true };

    } catch (error) {
      console.error(`Unexpected error updating setting "${key}":`, error);
      toast.error(`خطأ غير متوقع: ${(error as Error).message}`);
      return { success: false, error };
    } finally {
       setIsLoading(false);
    }
  };

  const contextValue: SettingsContextType = {
    settings,
    isLoading,
    getSetting,
    updateSetting,
    refreshSettings: fetchSettings, // Expose fetchSettings as refreshSettings
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use SettingsContext
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("يجب استخدام useSettings داخل SettingsProvider");
  }
  return context;
};
