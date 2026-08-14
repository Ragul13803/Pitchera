export declare const env: {
    port: number;
    nodeEnv: string;
    isProduction: boolean;
    database: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    google: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        gmailRedirectUri: string;
        webClientId: string;
    };
    encryptionKey: string;
    frontendUrl: string;
    uploadDir: string;
    maxFileSizeMb: number;
};
//# sourceMappingURL=env.d.ts.map