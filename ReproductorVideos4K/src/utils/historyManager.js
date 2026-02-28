import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@video_history_v2'; // Changed key to reset history with new format

export const loadHistory = async () => {
    try {
        const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
        return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (e) {
        console.log('Error loading history', e);
        return [];
    }
};

export const saveToHistory = async (uri, name, thumbnailUri) => {
    try {
        const history = await loadHistory();
        let newHistory = [{ uri, name, thumbnailUri }, ...history.filter(v => v.uri !== uri)];
        newHistory = newHistory.slice(0, 10); // Keep up to 10
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
    } catch (e) {
        console.log('Error saving history', e);
        return [];
    }
};
