import { GalleryItem, PhotoboothSettings, Concept } from '../types';
import { DEFAULT_GAS_URL } from '../constants';

const getGasUrl = () => {
  const storedUrl = localStorage.getItem('APPS_SCRIPT_BASE_URL');
  if (storedUrl && storedUrl.startsWith('https://script.google.com')) {
    return storedUrl;
  }
  return DEFAULT_GAS_URL;
};

const postToGas = async (data: any) => {
  const url = getGasUrl();
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('GAS POST Error:', error);
    return { ok: false, error: 'Connection failed' };
  }
};

export const uploadToDrive = async (base64Image: string, metadata: any) => {
  return await postToGas({
    action: 'uploadGenerated',
    image: base64Image,
    ...metadata
  });
};

export const fetchGallery = async (): Promise<GalleryItem[]> => {
  const url = getGasUrl();
  try {
    const response = await fetch(`${url}?action=gallery&t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!response.ok) throw new Error("HTTP " + response.status);
    
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (error) {
    console.error("Fetch Gallery Error:", error);
    throw error;
  }
};

export const deletePhoto = async (id: string, pin: string) => {
  return await postToGas({ action: 'deletePhoto', id, pin });
};

export const resetAppData = async (pin: string) => {
  return await postToGas({ action: 'resetApp', pin });
};

export const uploadOverlayToGas = async (base64Image: string, pin: string) => {
  return await postToGas({ action: 'uploadOverlay', pin, image: base64Image });
};

export const saveSettingsToGas = async (settings: PhotoboothSettings, pin: string) => {
  const result = await postToGas({ action: 'updateSettings', pin, settings });
  return result.ok;
};

export const saveConceptsToGas = async (concepts: Concept[], pin: string) => {
  const result = await postToGas({ action: 'updateConcepts', pin, concepts });
  return result.ok;
};