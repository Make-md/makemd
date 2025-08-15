import { Superstate } from "makemd-core";
import { useState, useCallback, useRef } from "react";

// Debounced save function to prevent excessive re-renders
export const useDebouncedSave = (superstate: Superstate, delay: number = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      try {
        superstate.saveSettings();
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }, delay);
  }, [superstate, delay]);
  
  const immediateSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    try {
      superstate.saveSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [superstate]);
  
  return { debouncedSave, immediateSave };
};