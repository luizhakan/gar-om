import { useContext } from 'react';
import { ContextoCozinha } from '../contexts/ContextoCozinha';

export function useCozinha() {
    return useContext(ContextoCozinha);
}
