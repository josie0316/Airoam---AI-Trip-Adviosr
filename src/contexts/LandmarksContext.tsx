import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Landmark } from '@/types/Landmark';

// Context for managing selected landmarks across the application
interface LandmarksContextType {
  selectedLandmarks: Landmark[];
  addLandmark: (landmark: Landmark) => void;
  removeLandmark: (id: string) => void;
  clearLandmarks: () => void;
}

const LandmarksContext = createContext<LandmarksContextType | undefined>(undefined);

export const LandmarksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedLandmarks, setSelectedLandmarks] = useState<Landmark[]>([]);

  // Add a landmark to the selected list (avoid duplicates)
  const addLandmark = (landmark: Landmark) => {
    setSelectedLandmarks(prev => {
      if (prev.find(item => item.id === landmark.id)) return prev;
      return [...prev, landmark];
    });
  };

  // Remove a landmark from the selected list
  const removeLandmark = (id: string) => {
    setSelectedLandmarks(prev => prev.filter(item => item.id !== id));
  };

  const clearLandmarks = () => {
    setSelectedLandmarks([]);
  };

  return (
    <LandmarksContext.Provider value={{ selectedLandmarks, addLandmark, removeLandmark, clearLandmarks }}>
      {children}
    </LandmarksContext.Provider>
  );
};

export const useLandmarks = () => {
  const context = useContext(LandmarksContext);
  if (context === undefined) {
    throw new Error('useLandmarks must be used within a LandmarksProvider');
  }
  return context;
}; 