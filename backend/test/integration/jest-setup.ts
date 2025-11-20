import { config } from 'dotenv';
import { resolve } from 'path';

if (process.env.NODE_ENV === 'test') {
    config({ path: resolve(__dirname, '../.env.test') });
} else {
    config();
}
