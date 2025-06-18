export interface HiddenSpot {
    id: string;
    name: string;
    description: string;
    location: {
        latitude: number;
        longitude: number;
    };
    vibe: 'Romantic' | 'Serene' | 'Creative';
    photos: string[];
    stories: string[];
    ratings: {
        uniqueness: number;
        vibe: number;
        safety: number;
        crowdLevel: number;
    };
    communityTips: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    username: string;
    profilePicture: string;
    submittedSpots: HiddenSpot[];
    experiences: Experience[];
}

export interface Experience {
    id: string;
    spotId: string;
    userId: string;
    content: string;
    isPublic: boolean;
    createdAt: Date;
}

export interface Rating {
    spotId: string;
    userId: string;
    uniqueness: number;
    vibe: number;
    safety: number;
    crowdLevel: number;
    createdAt: Date;
}