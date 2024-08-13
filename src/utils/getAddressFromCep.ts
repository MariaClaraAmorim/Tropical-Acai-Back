import axios from 'axios';

// Função para obter o endereço a partir do CEP usando ViaCEP
async function getAddressFromCep(cep: string): Promise<string> {
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (response.data.erro) {
            throw new Error('CEP não encontrado');
        }
        const { logradouro, bairro, localidade, uf } = response.data;
        return `${logradouro}, ${bairro}, ${localidade} - ${uf}`;
    } catch (error: any) {
        console.error('Erro ao obter endereço:', error.message);
        throw new Error('Falha ao obter o endereço');
    }
}
