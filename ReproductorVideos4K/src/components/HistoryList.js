import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function HistoryList({ history, onSelectVideo }) {
    if (!history || history.length === 0) return null;

    return (
        <ScrollView style={styles.historyList}>
            {history.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => onSelectVideo(item.uri)}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconBox}>
                        {item.thumbnailUri ? (
                            <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnailImage} resizeMode="cover" />
                        ) : (
                            <Feather name="play-circle" size={22} color="#3498db" />
                        )}
                        {item.thumbnailUri && (
                            <View style={styles.playOverlay}>
                                <Feather name="play" size={14} color="#fff" />
                            </View>
                        )}
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.historyItemText} numberOfLines={1}>
                            {item.name || 'Video Desconocido'}
                        </Text>
                        <Text style={styles.historyPathText} numberOfLines={1}>
                            {item.uri}
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#555" />
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    historyList: {
        width: '100%',
        marginTop: 20,
    },
    historyItem: {
        backgroundColor: '#111116',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
    },
    iconBox: {
        width: 65,    // Más ancho para parecer miniatura de video (Aspect ratio 16:9)
        height: 42,
        borderRadius: 8, // Bordes un poco menos pronunciados para imágenes
        backgroundColor: '#1A293E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        overflow: 'hidden',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    historyItemText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    historyPathText: {
        color: '#666',
        fontSize: 12,
    }
});
