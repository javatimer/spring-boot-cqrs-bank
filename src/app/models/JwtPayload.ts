export interface JwtPayload {
    preferred_username: string;

    realm_access?: {
        roles: string[];
    };

    exp: number;

    iat: number;
}