import axios from 'axios';

// Coordenadas da loja
const STORE_LOCATION = { lat: -12.134738, lng: -44.990359};


// Novo URL da API do AwesomeAPI para buscar o CEP
const AWESOME_API_URL = 'https://cep.awesomeapi.com.br/json';

// Função para buscar o endereço pelo CEP
async function getAddressFromCep(cep: string): Promise<{ lat: number; lng: number }> {
    try {
        const response = await axios.get(`${AWESOME_API_URL}/${cep}`);
        const { lat, lng } = response.data;

        if (!lat || !lng) {
            throw new Error('Localização não encontrada para o CEP');
        }

        return { lat: parseFloat(lat), lng: parseFloat(lng) };
    } catch (error: any) {
        console.error('Erro ao buscar endereço:', error);
        throw new Error('Erro ao buscar endereço');
    }
}

function calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // Raio da Terra em quilômetros
    const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
    const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(coord1.lat * (Math.PI / 180)) * Math.cos(coord2.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em quilômetros
}

function calculateDeliveryFee(distance: number): number {
    const baseFee = 5.00; // Taxa base em reais
    const perKmFee = 1.00; // Taxa por quilômetro em reais

    return parseFloat((baseFee + (distance * perKmFee)).toFixed(2));
}

export async function calculateDeliveryFeeFromCep(cep: string): Promise<number> {
    try {
        const { lat, lng } = await getAddressFromCep(cep);

        const distance = calculateDistance(STORE_LOCATION, { lat, lng });
        return calculateDeliveryFee(distance);
    } catch (error: any) {
        throw new Error(`Erro ao calcular a taxa de entrega: ${error.message}`);
    }
}
