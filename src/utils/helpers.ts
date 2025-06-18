export const formatDistance = (distance: number): string => {
    if (distance < 1000) {
        return `${distance} m`;
    }
    return `${(distance / 1000).toFixed(2)} km`;
};

export const formatDate = (date: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
};

export const calculateAverageRating = (ratings: number[]): number => {
    if (ratings.length === 0) return 0;
    const total = ratings.reduce((acc, rating) => acc + rating, 0);
    return total / ratings.length;
};

export const filterHiddenSpots = (spots: any[], filterCriteria: any): any[] => {
    return spots.filter(spot => {
        return (
            spot.vibe === filterCriteria.vibe &&
            spot.unique &&
            spot.safe
        );
    });
};