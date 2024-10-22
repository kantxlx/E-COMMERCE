document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search');
    const sortSelect = document.getElementById('sort');

    // Função para fazer a busca e ordenação
    const fetchProducts = () => {
        const searchTerm = searchInput.value.trim();
        const sortOption = sortSelect.value;

        let params = [];

        // Se houver um termo de busca, adiciona o parâmetro
        if (searchTerm) {
            params.push(`nome=${encodeURIComponent(searchTerm)}`);
        }

        // Se houver uma opção de ordenação selecionada, adiciona o parâmetro
        if (sortOption) {
            let ordenar;
            switch (sortOption) {
                case 'nome_asc':
                    ordenar = 'nome-asc';
                    break;
                case 'nome_desc':
                    ordenar = 'nome-desc';
                    break;
                case 'preco_asc':
                    ordenar = 'preco-asc';
                    break;
                case 'preco_desc':
                    ordenar = 'preco-desc';
                    break;
            }
            if (ordenar) {
                params.push(`ordenar=${ordenar}`);
            }
        }

        // Redireciona para a rota com os parâmetros de busca e ordenação
        const queryString = params.length > 0 ? `?${params.join('&')}` : '';
        console.log(`Redirecionando para: /admin/edit-products${queryString}`); // Debug
        window.location.href = `/admin/edit-products${queryString}`;
    };

    // Evento para o botão de busca
    searchBtn.addEventListener('click', fetchProducts);

    // Evento para a mudança no select de ordenação
    sortSelect.addEventListener('change', fetchProducts);
});
