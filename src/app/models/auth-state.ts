import { JwtPayload } from "./JwtPayload";

export interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    payload: JwtPayload | null;
}