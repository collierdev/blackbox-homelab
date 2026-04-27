export type OAuthProvider = 'google' | 'microsoft';
export interface ProviderConfigPublic {
    provider: OAuthProvider;
    configured: boolean;
    clientId?: string;
    tenantId?: string;
    updatedAt?: string;
}
export interface ProviderOAuthConfig {
    provider: OAuthProvider;
    clientId: string;
    clientSecret: string;
    tenantId?: string;
}
export declare function upsertProviderConfig(provider: OAuthProvider, data: {
    clientId: string;
    clientSecret: string;
    tenantId?: string;
}): Promise<void>;
export declare function getProviderConfigPublic(provider: OAuthProvider): Promise<ProviderConfigPublic>;
export declare function getProviderOAuthConfig(provider: OAuthProvider): Promise<ProviderOAuthConfig | null>;
//# sourceMappingURL=providerConfig.d.ts.map