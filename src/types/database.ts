export interface Placement {
    id: string;
    landing_url: string;
    created_at: string;
}

export interface Database {
    public: {
        Tables: {
            placements: {
                Row: Placement;
                Insert: Omit<Placement, 'id' | 'created_at'>;
                Update: Partial<Omit<Placement, 'id' | 'created_at'>>;
            };
        };
    };
} 