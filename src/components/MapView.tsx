import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getHiddenSpots } from '../services/api';

const MapViewComponent = () => {
    const [spots, setSpots] = useState([]);

    useEffect(() => {
        const fetchSpots = async () => {
            const data = await getHiddenSpots();
            setSpots(data);
        };

        fetchSpots();
    }, []);

    const getMarkerColor = (vibe) => {
        switch (vibe) {
            case 'Romantic':
                return 'red';
            case 'Serene':
                return 'blue';
            case 'Creative':
                return 'green';
            default:
                return 'gray';
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 26.2183, // Gwalior latitude
                    longitude: 78.1828, // Gwalior longitude
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {spots.map((spot) => (
                    <Marker
                        key={spot.id}
                        coordinate={{
                            latitude: spot.latitude,
                            longitude: spot.longitude,
                        }}
                        title={spot.name}
                        description={spot.vibe}
                        pinColor={getMarkerColor(spot.vibe)}
                    />
                ))}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
});

export default MapViewComponent;