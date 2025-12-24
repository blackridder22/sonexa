import keytar from 'keytar';

const SERVICE_NAME = 'Sonexa';

export async function getSecret(key: string): Promise<string | null> {
    try {
        const value = await keytar.getPassword(SERVICE_NAME, key);
        return value;
    } catch (error) {
        console.error(`Failed to get secret '${key}':`, error);
        return null;
    }
}

export async function setSecret(key: string, value: string): Promise<void> {
    try {
        await keytar.setPassword(SERVICE_NAME, key, value);
    } catch (error) {
        console.error(`Failed to set secret '${key}':`, error);
        throw error;
    }
}

export async function deleteSecret(key: string): Promise<boolean> {
    try {
        const result = await keytar.deletePassword(SERVICE_NAME, key);
        return result;
    } catch (error) {
        console.error(`Failed to delete secret '${key}':`, error);
        return false;
    }
}

// Known secret keys
export const SECRETS = {
    SUPABASE_KEY: 'supabase-key',
} as const;
