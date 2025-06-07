export interface Placement {
    id: string;
    advertiserId: string;
    publisherId: string;
    sendId: string;
    priceCpc: number;
    created_at: string;
    deleted_at?: string | null;
}

export interface Database {
    public: {
        Tables: {
            placements: {
                Row: Placement;
                Insert: Omit<Placement, 'id' | 'created_at' | 'deleted_at'> & { deleted_at?: string | null };
                Update: Partial<Omit<Placement, 'id' | 'created_at'>> & { deleted_at?: string | null };
            };
        };
    };
} 