import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, StatusBar, Animated, useWindowDimensions, BackHandler } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useState, useRef } from 'react';

export default function CustomVideoPlayer({ videoUri, onClose }) {
    const { width } = useWindowDimensions();
    const player = useVideoPlayer(videoUri, player => {
        player.loop = true;
        player.play();
    });

    const fadeAnimLeft = useRef(new Animated.Value(0)).current;
    const fadeAnimRight = useRef(new Animated.Value(0)).current;

    const [controlsVisible, setControlsVisible] = useState(true);
    const hideTimer = useRef(null);

    const resetHideTimer = () => {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
            setControlsVisible(false);
        }, 4000); // Ocultar Cerar despues de 4 segundos, similar al nativo
    };

    useEffect(() => {
        if (controlsVisible) {
            resetHideTimer();
        }
        return () => clearTimeout(hideTimer.current);
    }, [controlsVisible]);

    useEffect(() => {
        ScreenOrientation.unlockAsync();

        const subscription = ScreenOrientation.addOrientationChangeListener(async (evt) => {
            const currentOrientation = evt.orientationInfo.orientation;
            if (
                currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
                currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
            ) {
                StatusBar.setHidden(true);
                if (Platform.OS === 'android') {
                    await NavigationBar.setVisibilityAsync("hidden");
                    await NavigationBar.setBehaviorAsync("overlay-swipe");
                }
            } else {
                StatusBar.setHidden(false);
                if (Platform.OS === 'android') {
                    await NavigationBar.setVisibilityAsync("visible");
                }
            }
        });

        return () => {
            ScreenOrientation.removeOrientationChangeListener(subscription);
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            StatusBar.setHidden(false);
            if (Platform.OS === 'android') {
                NavigationBar.setVisibilityAsync("visible");
            }
        };
    }, []);

    const skipBackward = () => {
        if (player && player.currentTime > 10) {
            player.currentTime -= 10;
        } else if (player) {
            player.currentTime = 0;
        }
    };

    const skipForward = () => {
        if (player) {
            player.currentTime += 10;
        }
    };

    // Double tap implementations via Capture Phase
    let lastTapLeft = useRef(0);
    let lastTapRight = useRef(0);

    const handleStartShouldSetResponderCapture = (evt) => {
        const { pageX } = evt.nativeEvent;
        const now = Date.now();
        const isLeft = pageX < width / 2;

        if (isLeft) {
            if (now - lastTapLeft.current < 300) {
                return true; // Robamos el toque para doble tap
            }
            lastTapLeft.current = now;
        } else {
            if (now - lastTapRight.current < 300) {
                return true; // Robamos el toque para doble tap
            }
            lastTapRight.current = now;
        }

        // Es un tap simple (primer tap), no lo robamos, lo pasamos al VideoView nativo.
        // Pero aprovechamos de sincronizar nuestro boton Cerrar.
        setControlsVisible(v => {
            if (!v) {
                resetHideTimer();
                return true;
            }
            return false; // Si estaba visible, la ocultamos instantaneamente
        });

        return false;
    };

    const handleResponderRelease = (evt) => {
        // Ejecutar las animaciones tras capturar el doble toque
        const { pageX } = evt.nativeEvent;
        if (pageX < width / 2) {
            skipBackward();
            fadeAnimLeft.setValue(1);
            Animated.timing(fadeAnimLeft, { toValue: 0, duration: 800, useNativeDriver: true }).start();
        } else {
            skipForward();
            fadeAnimRight.setValue(1);
            Animated.timing(fadeAnimRight, { toValue: 0, duration: 800, useNativeDriver: true }).start();
        }
    };

    useEffect(() => {
        const backAction = () => {
            if (onClose) {
                onClose();
            }
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, [onClose]);

    return (
        <View style={styles.mainContainer}>
            <View
                style={styles.videoContainer}
                onStartShouldSetResponderCapture={handleStartShouldSetResponderCapture}
                onResponderRelease={handleResponderRelease}
            >
                <VideoView
                    style={styles.video}
                    player={player}
                    allowsFullscreen
                    allowsPictureInPicture
                />

                {/* Animaciones de 10s */}
                <View style={styles.animationsOverlay} pointerEvents="none">
                    <View style={styles.touchSideLeft}>
                        <Animated.View style={[styles.skipIndicator, { opacity: fadeAnimLeft }]}>
                            <Text style={styles.skipText}>⏪ 10s</Text>
                        </Animated.View>
                    </View>
                    <View style={styles.touchSideRight}>
                        <Animated.View style={[styles.skipIndicator, { opacity: fadeAnimRight }]}>
                            <Text style={styles.skipText}>10s ⏩</Text>
                        </Animated.View>
                    </View>
                </View>
            </View>

            {controlsVisible && (
                <View style={styles.controlsOverlay} pointerEvents="box-none">
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.buttonText}>Cerrar ✖</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#000',
    },
    videoContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    animationsOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        zIndex: 5,
    },
    touchSideLeft: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    touchSideRight: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipIndicator: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 30,
    },
    skipText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    controlsOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30, // Adjust for notch safely
        width: '100%',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    closeButton: {
        backgroundColor: 'rgba(30,30,40,0.85)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
