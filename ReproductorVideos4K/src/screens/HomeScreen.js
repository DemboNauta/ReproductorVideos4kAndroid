import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, TextInput, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { loadHistory, saveToHistory } from '../utils/historyManager';
import HistoryList from '../components/HistoryList';
import CustomVideoPlayer from '../components/CustomVideoPlayer';
import { Feather } from '@expo/vector-icons';

// Import local logo
import LogoImage from '../../assets/logo.png';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const [videoUri, setVideoUri] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('explorar');

    useEffect(() => {
        fetchHistory();

        // Chequear si se abrió la app desde otra (ej: Galería de Android) con un video
        const handleDeepLink = async () => {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                // Genera la entrada en el historial
                await registerAndPlayVideo(initialUrl, 'Video desde Galería');
            }
        };

        handleDeepLink();

        // En caso de que la app ya estuviera abierta de fondo
        const subscription = Linking.addEventListener('url', (event) => {
            if (event.url) {
                registerAndPlayVideo(event.url, 'Video desde Galería');
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const registerAndPlayVideo = async (uri, name) => {
        setVideoUri(uri);
        // Extraer el frame (imagen en miniatura)
        let thumbnail = null;
        try {
            const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(uri, {
                time: 0,
                quality: 0.5,
            });
            thumbnail = thumbUri;
        } catch (e) {
            console.log("Error generando thumbnail intent:", e);
        }

        const newHistory = await saveToHistory(uri, name, thumbnail);
        setHistory(newHistory);
    };

    const fetchHistory = async () => {
        const storedHistory = await loadHistory();
        setHistory(storedHistory);
    };

    const handlePickVideo = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'video/*',
                copyToCacheDirectory: false
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                const uri = selectedAsset.uri;
                await registerAndPlayVideo(uri, selectedAsset.name || 'Video Desconocido');
            }
        } catch (error) {
            console.log('Error picking video:', error);
        }
    };

    if (videoUri) {
        return <CustomVideoPlayer videoUri={videoUri} onClose={() => setVideoUri(null)} />;
    }

    const renderExplorar = () => (
        <ScrollView style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Explorar Almacenamiento</Text>
            <Text style={styles.sectionSubtitle}>Selecciona carpetas o archivos de tu dispositivo para reproducirlos.</Text>

            <TouchableOpacity style={styles.storageCard} onPress={handlePickVideo} activeOpacity={0.7}>
                <View style={[styles.storageIconBox, { backgroundColor: '#1A2634' }]}>
                    <Feather name="hard-drive" size={20} color="#3498db" />
                </View>
                <View style={styles.storageTextContainer}>
                    <Text style={styles.storageTitle}>Almacenamiento Interno</Text>
                    <Text style={styles.storageSubtitle}>Explorar carpetas</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#555" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.storageCard} onPress={handlePickVideo} activeOpacity={0.7}>
                <View style={[styles.storageIconBox, { backgroundColor: '#1A2634' }]}>
                    <Feather name="smartphone" size={20} color="#3498db" />
                </View>
                <View style={styles.storageTextContainer}>
                    <Text style={styles.storageTitle}>Tarjeta SD</Text>
                    <Text style={styles.storageSubtitle}>Explorar SD</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#555" />
            </TouchableOpacity>



            <View style={styles.emptyStateContainer}>
                <View style={styles.emptyIconCircle}>
                    <Feather name="folder" size={32} color="#555" />
                </View>
                <Text style={styles.emptyStateTitle}>Sin videos cargados</Text>
                <Text style={styles.emptyStateSubtitle}>
                    Usa los botones de arriba para explorar tu{'\n'}almacenamiento
                </Text>
            </View>
        </ScrollView>
    );



    const renderHistorial = () => (
        <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Historial</Text>
            <Text style={styles.sectionSubtitle}>{history.length} videos reproducidos</Text>

            {history.length > 0 ? (
                <HistoryList history={history} onSelectVideo={(uri) => setVideoUri(uri)} />
            ) : (
                <View style={[styles.emptyStateContainer, { marginTop: '35%' }]}>
                    <View style={styles.emptyIconCircle}>
                        <Feather name="clock" size={32} color="#555" />
                    </View>
                    <Text style={styles.emptyStateTitle}>Sin historial de reproduccion</Text>
                    <Text style={styles.emptyStateSubtitle}>
                        Los videos que reproduzcas apareceran aqui
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.topHeader}>
                    <View style={styles.headerLogoBox}>
                        <Image source={LogoImage} style={styles.headerLogoImage} resizeMode="contain" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Ziro 4K</Text>
                        <Text style={styles.headerSubtitle}>Reproductor de Video</Text>
                    </View>
                </View>

                {/* Top Border separator */}
                <View style={styles.separator} />

                {/* Content Switcher */}
                <View style={styles.mainContent}>
                    {activeTab === 'explorar' && renderExplorar()}
                    {activeTab === 'historial' && renderHistorial()}
                </View>

                {/* Bottom Tab Navigation */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('explorar')}>
                        <Feather name="folder" size={24} color={activeTab === 'explorar' ? '#3498db' : '#555'} />
                        <Text style={[styles.navText, activeTab === 'explorar' && styles.navTextActive]}>Explorar</Text>
                        {activeTab === 'explorar' && <View style={styles.activeTabIndicator} />}
                    </TouchableOpacity>



                    <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('historial')}>
                        <Feather name="clock" size={24} color={activeTab === 'historial' ? '#3498db' : '#555'} />
                        <Text style={[styles.navText, activeTab === 'historial' && styles.navTextActive]}>Historial</Text>
                        {activeTab === 'historial' && <View style={styles.activeTabIndicator} />}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        width: '100%',
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 45, // give space for notch
        paddingBottom: 15,
        backgroundColor: '#0a0a0a',
    },
    headerLogoBox: {
        width: 60, // Aumentado para que el logo se vea mas grande
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        // Eliminado backgroundColor azul porque el logo suele traer sus propios colores/fondo
    },
    headerLogoImage: {
        width: '100%',
        height: '100%',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        color: '#777',
        fontSize: 13,
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#1a1a1a',
        width: '100%',
    },
    mainContent: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sectionSubtitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 25,
        lineHeight: 20,
    },
    storageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111116',
        borderRadius: 16,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#222',
    },
    storageIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    storageTextContainer: {
        flex: 1,
    },
    storageTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    storageSubtitle: {
        color: '#777',
        fontSize: 13,
    },
    dashedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1e3852',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 18,
        marginTop: 5,
    },
    dashedButtonText: {
        color: '#3498db',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 10,
    },
    emptyStateContainer: {
        alignItems: 'center',
        marginTop: 50,
        paddingHorizontal: 20,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyStateTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    emptyStateSubtitle: {
        color: '#777',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111116',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#222',
    },
    searchInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 15,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
        paddingBottom: 35, // Aumentado para no chocar con los botones de navegación de Android
        paddingTop: 10,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    navText: {
        color: '#555',
        fontSize: 11,
        marginTop: 6,
        fontWeight: '600',
    },
    navTextActive: {
        color: '#3498db',
    },
    activeTabIndicator: {
        position: 'absolute',
        top: -10,
        width: 40,
        height: 3,
        backgroundColor: '#3498db',
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
    }
});
