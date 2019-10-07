import { createHash } from 'crypto';

export function getHashFromObj(obj: any): string | null {
    try {
        return createHash('sha256').update(JSON.stringify(obj)).digest('hex');
    } catch (e) {
        return null;
    }
}
