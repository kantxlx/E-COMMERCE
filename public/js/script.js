//Login
document.addEventListener('DOMContentLoaded', function() {
    const userLoggedIn = sessionStorage.getItem('userLoggedIn'); // Verifica se o usuário está logado
    const loginIcon = document.getElementById('login-icon');
    const loginLink = document.getElementById('login-link');
    const perfilMenu = document.getElementById('perfil-menu');

    // Verifique se o usuário está logado
    if (userLoggedIn === 'true') {
        // Troca a imagem do botão de login por um ícone de perfil
        loginIcon.setAttribute('src', '/img/user-logado.png'); // Novo ícone de perfil
        loginIcon.setAttribute('alt', 'Perfil do Usuário');

        // Muda o link para o perfil
        loginLink.setAttribute('href', '#'); // O dropdown aparecerá no clique

        // Mostrar o menu de perfil ao passar o mouse sobre o link ou ícone
        loginLink.addEventListener('mouseenter', showMenu);
        loginIcon.addEventListener('mouseenter', showMenu);

        // Esconde o menu quando o mouse sair do ícone de login ou do próprio menu
        loginLink.addEventListener('mouseleave', hideMenuWithDelay);
        perfilMenu.addEventListener('mouseleave', hideMenuWithDelay);

        function showMenu() {
            perfilMenu.style.display = 'block'; // Mostra o menu
            clearTimeout(hideTimeout); // Limpa o timeout, se houver
        }

        let hideTimeout; // Variável para armazenar o timeout

        function hideMenuWithDelay() {
            hideTimeout = setTimeout(function() {
                perfilMenu.style.display = 'none'; // Esconde o menu após um pequeno atraso
            }, 200); // Atraso de 200ms
        }

        // Garante que o menu permaneça visível ao passar o mouse sobre ele
        perfilMenu.addEventListener('mouseenter', function() {
            perfilMenu.style.display = 'block'; // Mantém o menu visível
            clearTimeout(hideTimeout); // Limpa o timeout
        });
    } else {
        // Caso o usuário não esteja logado, garanta que a imagem de login padrão seja exibida
        loginIcon.setAttribute('src', '/img/login1.0.png'); // Imagem de login padrão
        loginIcon.setAttribute('alt', 'Entrar/Cadastrar');
        
        // Configurar o link de login
        loginLink.setAttribute('href', '/login');
    }

    // Logout
    document.getElementById('logout').addEventListener('click', function() {
        sessionStorage.removeItem('userLoggedIn'); // Remove o status de login
        window.location.href = '/login'; // Redireciona para a página de login
    });
});

//-----------------------------------------------------------------------

// Abre o modal quando clica no ícone
document.getElementById('openSupportModal').onclick = function(event) {
    event.preventDefault(); // Previne comportamento padrão do link
    document.getElementById('supportModal').style.display = 'flex';
}

// Fecha o modal ao clicar no botão de fechar
document.querySelector('.close-support-modal').onclick = function() {
    document.getElementById('supportModal').style.display = 'none';
}

// Fecha o modal se o usuário clicar fora da área de conteúdo
window.onclick = function(event) {
    if (event.target == document.getElementById('supportModal')) {
        document.getElementById('supportModal').style.display = 'none';
    }
}

// Botão do WhatsApp
document.querySelector('.support-whatsapp-btn').onclick = function() {
    window.open('https://wa.me/+556195795346', '_blank');
}

// Botão do Instagram
document.querySelector('.support-instagram-btn').onclick = function() {
    window.open('https://www.instagram.com/kalegacy_oficial/', '_blank');
}

// Botão do E-mail
document.querySelector('.support-email-btn').onclick = function() {
    window.location.href = 'mailto:contatokalegacy@gmail.com?subject=Contato%20Central%20de%20Atendimento';
}

//-----------------------------------------------------------------------------

//Evento nav-bar imagens
async function updateImage(marca, item) {
    try {
        const response = await fetch(`/produtos/imagens?marca=${marca}`);
        if (!response.ok) throw new Error('Erro ao buscar imagens');

        const imagens = await response.json();

        if (imagens.length === 0) {
            console.log('Nenhuma imagem encontrada para a marca', marca);
            return;
        }

        // Atualiza a imagem principal
        const imgSrc = `/uploads/${imagens[0]}`; // Usar a primeira imagem
        const imgElement = document.getElementById('marca-imagem');
        imgElement.src = imgSrc;
        
        // Mostra o quadrado de imagem ao lado do dropdown
        const imagemContainer = document.querySelector('.imagem-marcas-container');
        imagemContainer.style.display = 'flex';

        // Posiciona ao lado do dropdown, ajustando ao lado do item pai
        const parentDropdown = item.closest('.dropdown-container');
        const rect = parentDropdown.getBoundingClientRect();
        imagemContainer.style.top = `${rect.top}px`;
        imagemContainer.style.left = `${rect.right + 10}px`; // Colado ao dropdown

        // Ajuste a posição para mais abaixo e mais à direita
        const topPosition = rect.bottom + 20; // 20px mais para baixo
        const leftPosition = rect.right + 85; // 40px mais à direita

        imagemContainer.style.top = `${topPosition}px`;
        imagemContainer.style.left = `${leftPosition}px`;

        // Adiciona a classe que controla a animação de visibilidade
        imagemContainer.classList.add('mostrar');

    } catch (error) {
        console.error(error);
    }
}

// Adiciona evento de mouseover para mostrar a imagem
document.querySelectorAll('.marca-item').forEach(item => {
    item.addEventListener('mouseover', function() {
        const marca = this.getAttribute('data-marca');
        // Atualiza a imagem da marca
        updateImage(marca, this);
    });
});

// Evento para esconder a imagem quando o mouse sair do menu
document.querySelectorAll('.dropdown-container').forEach(container => {
    container.addEventListener('mouseleave', function() {
        const imagemContainer = document.querySelector('.imagem-marcas-container');
        // Esconde a imagem com transição suave
        imagemContainer.classList.remove('mostrar');
        setTimeout(() => {
            imagemContainer.style.display = 'none';
            document.getElementById('marca-imagem').src = ''; // Limpa a imagem
        }, 500); // Delay para permitir a animação antes de esconder completamente
    });
});

//----------------------------------------------------------------------------------

//Carousel de imagens
document.addEventListener('DOMContentLoaded', () => {
    let currentIndex = 0;
    const images = document.querySelectorAll('.carousel-images img');
    const dots = document.querySelectorAll('.dash');
    const totalImages = images.length;

    // Função que atualiza a posição das imagens no carrossel
    function updateCarousel() {
        const offset = -currentIndex * 100; // Cada imagem ocupa 100vw
        document.querySelector('.carousel-images').style.transform = `translateX(${offset}vw)`;

        // Atualiza os traços ativos
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    // Função para mostrar a imagem anterior
    function showPrevImage() {
        currentIndex = (currentIndex === 0) ? totalImages - 1 : currentIndex - 1;
        updateCarousel();
    }

    // Função para mostrar a próxima imagem
    function showNextImage() {
        currentIndex = (currentIndex === totalImages - 1) ? 0 : currentIndex + 1;
        updateCarousel();
    }

    // Eventos de clique para as setas
    document.querySelector('.carousel-prev').addEventListener('click', showPrevImage);
    document.querySelector('.carousel-next').addEventListener('click', showNextImage);

    // Evento de clique para os traços
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateCarousel();
        });
    });

    // Inicializa o carrossel
    updateCarousel();

    // Troca automaticamente a imagem a cada 15 segundos
    setInterval(showNextImage, 15000);
});

//----------------------------------------------------------------------------------

// Carrossel de Marcas
const faixaMarcas = document.querySelector('.faixa-marcas');
const pontos = document.querySelectorAll('.ponto');
let indiceAtual = 0;
const marcasPorSlide = 4;
const totalMarcas = document.querySelectorAll('.faixa-marcas a').length;
const totalSlides = Math.ceil(totalMarcas / marcasPorSlide);
const totalPontos = pontos.length; // Total de pontos (7)

// Atualiza o carrossel de marcas
function atualizarCarrossel(indice) {
    const deslocamento = -(indice * 100 / marcasPorSlide); 
    faixaMarcas.style.transform = `translateX(${deslocamento}%)`;

    pontos.forEach((ponto, idx) => {
        ponto.classList.toggle('ativo', idx === indice);
    });
}

// Clique nos pontinhos para trocar as marcas
pontos.forEach((ponto, indice) => {
    ponto.addEventListener('click', () => {
        indiceAtual = indice;
        atualizarCarrossel(indiceAtual);
    });
});

// Auto-play do carrossel de marcas
function autoPlayCarrossel() {
    indiceAtual = (indiceAtual + 1) % totalPontos; // Cicla entre os 7 pontos
    atualizarCarrossel(indiceAtual);
}

// Inicia o auto-play
let autoPlay = setInterval(autoPlayCarrossel, 5000);

// Para o auto-play quando o mouse passa sobre o carrossel
document.querySelector('.carrossel-marcas').addEventListener('mouseenter', () => {
    clearInterval(autoPlay);
});

// Reinicia o auto-play quando o mouse sai do carrossel
document.querySelector('.carrossel-marcas').addEventListener('mouseleave', () => {
    autoPlay = setInterval(autoPlayCarrossel, 5000);
});

//----------------------------------------------------------------------------------

// Função de busca com autocompletar
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const autocompleteList = document.getElementById('autocomplete-list');

    // Autocomplete
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim();
        if (query.length > 1) {
            try {
                const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
                const produtos = await response.json();
                autocompleteList.innerHTML = ''; 

                if (produtos.length > 0) {
                    produtos.forEach(produto => {
                        const listItem = document.createElement('li');
                        listItem.textContent = produto.nome;
                        listItem.addEventListener('click', () => {
                            searchInput.value = produto.nome;
                            autocompleteList.innerHTML = '';
                        });
                        autocompleteList.appendChild(listItem);
                    });
                } else {
                    const noResult = document.createElement('li');
                    noResult.textContent = 'Nenhum produto encontrado';
                    autocompleteList.appendChild(noResult);
                }
            } catch (error) {
                console.error('Erro ao buscar produtos:', error);
            }
        } else {
            autocompleteList.innerHTML = '';
        }
    });

    // Redireciona para a página de resultados
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `/produtos?nome=${encodeURIComponent(query)}`;
        }
    });
});

//----------------------------------------------------------------------------------

//carrinho
document.addEventListener('DOMContentLoaded', () => {
    const cartModal = document.getElementById('cart-modal');
    const closeCartButton = document.querySelector('.close-cart');
    const cartIcon = document.getElementById('cart-icon');
    const cartItemsContainer = document.getElementById('cart-items');
    const checkoutButton = document.getElementById('checkout-button');
    const cartCount = document.getElementById('cart-count');

    // Função para exibir o modal do carrinho
    function showCartModal() {
        cartModal.style.display = 'block';
        setTimeout(() => {
            cartModal.style.transform = 'translateX(0)';
        }, 10);
        updateCartItems(); // Atualiza os itens no modal ao abrir
    }

    // Função para esconder o modal do carrinho
    function hideCartModal() {
        cartModal.style.transform = 'translateX(100%)';
        setTimeout(() => {
            cartModal.style.display = 'none';
        }, 300); // Aguarda a animação de fechamento
    }

    // Função para atualizar os itens do carrinho
    async function updateCartItems() {
        try {
            const response = await fetch('/cart/carrinho/items'); // Rota para obter itens do carrinho
            const cartItems = await response.json();
            
            // Limpar container de itens do carrinho
            cartItemsContainer.innerHTML = '';
            let total = 0;

            if (cartItems.length === 0) {
                cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
            } else {
                cartItems.forEach(item => {
                    const cartItemHTML = `
                        <div class="cart-item">
                            <img src="/uploads/${item.imagemCapa}" alt="${item.name}" style="cursor: pointer;" onclick="window.location.href='/product-details/${item.productId}'">
                            <div class="product-details">
                                <div class="product-name" style="cursor: pointer;" onclick="window.location.href='/product-details/${item.productId}'">
                                    ${item.name}
                                </div>
                                <div class="product-price">R$ ${item.price}</div>
                                <div class="product-quantity">
                                    Quantidade: 
                                    <span>${item.quantity}</span>
                                </div>
                            </div>
                            <span class="remove-item" data-id="${item.productId}">&times;</span>
                        </div>
                    `;
                    cartItemsContainer.innerHTML += cartItemHTML;
                    total += item.price * item.quantity; // Adiciona o valor ao total
                });
            }

            // Atualiza o contador do carrinho
            const countResponse = await fetch('/cart/count');
            const countData = await countResponse.json();
            cartCount.textContent = countData.count;

            // Atualiza o total no modal
            document.getElementById('cart-total').textContent = `Total: R$ ${total.toFixed(2)}`;
        } catch (error) {
            console.error('Erro ao atualizar itens do carrinho:', error);
        }
    }

    // Função para remover um item do carrinho
    async function removeCartItem(event) {
        const target = event.target;
        if (target.classList.contains('remove-item')) {
            event.stopPropagation(); // Impede que o evento de clique se propague para o contêiner do item
            const itemId = target.getAttribute('data-id');
            try {
                await fetch(`/cart/remove/${itemId}`, { method: 'POST' }); // Alterado para usar método POST
                updateCartItems(); // Atualiza os itens após remover
            } catch (error) {
                console.error('Erro ao remover item do carrinho:', error);
            }
        }
    }

    // Evento para remover um item do carrinho
    cartItemsContainer.addEventListener('click', removeCartItem);

    // Evento para abrir o modal do carrinho
    cartIcon.addEventListener('click', function(event) {
        event.preventDefault(); // Impede o comportamento padrão do link
        showCartModal();
    });

    // Evento para fechar o modal do carrinho
    closeCartButton.addEventListener('click', hideCartModal);

    // Fecha o modal ao clicar fora do conteúdo
    window.addEventListener('click', function(event) {
        if (event.target === cartModal) {
            hideCartModal();
        }
    });

    // Evento para remover um item do carrinho
    cartItemsContainer.addEventListener('click', removeCartItem);

    // Evento para finalizar a compra
    checkoutButton.addEventListener('click', () => {
        window.location.href = '/cart/carrinho'; // Redireciona para a página de finalização
    });

    // Atualiza o contador do carrinho e os itens no carregamento da página
    updateCartItems();
});

//----------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    const sliders = document.querySelectorAll('.product-slider');
    
    sliders.forEach(slider => {
        const prevBtn = slider.parentElement.querySelector('.slider-nav.prev');
        const nextBtn = slider.parentElement.querySelector('.slider-nav.next');
        const items = slider.querySelectorAll('.product-item');
        const itemsPerPage = 5; // Quantos itens mostrar por vez
        let currentIndex = 0;
        let itemArray = Array.from(items); // Cria um array de itens

        // Função para reaplicar os event listeners nos botões 'Comprar'
        const attachBuyButtonListeners = () => {
            slider.querySelectorAll('.buy-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const productId = btn.getAttribute('data-id');
                    const quantityInput = btn.closest('.product-item').querySelector('input[type="number"]');
                    const quantity = quantityInput ? quantityInput.value : 1;

                    console.log('ID do produto:', productId);
                    console.log('Quantidade:', quantity);

                    const loggedIn = localStorage.getItem('loggedIn') === 'true';

                    if (!loggedIn) {
                        document.getElementById('modal-login').style.display = 'block';
                        return;
                    }

                    try {
                        const response = await fetch(`/cart/add/${productId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ quantity })
                        });

                        const result = await response.json();

                        if (response.status === 401) {
                            document.getElementById('modal-login').style.display = 'block';
                        } else if (response.ok) {
                            setTimeout(() => {
                                window.location.reload();
                            }, 3000);
                            mostrarMensagem(result.message || 'Produto adicionado ao carrinho com sucesso!');
                        } else {
                            mostrarMensagem(result.message || 'Erro ao adicionar produto ao carrinho.');
                        }
                    } catch (error) {
                        console.error(error);
                        mostrarMensagem('Erro ao adicionar produto ao carrinho.');
                    }
                });
            });
        };

        // Função para atualizar a exibição dos itens de forma cíclica
        const showItems = () => {
            slider.innerHTML = ''; // Limpa os itens exibidos
            for (let i = 0; i < itemsPerPage; i++) {
                const index = (currentIndex + i) % itemArray.length; // Calcula o índice do item atual
                slider.appendChild(itemArray[index]); // Adiciona o item ao slider
            }
            attachBuyButtonListeners(); // Reaplica os listeners nos botões 'Comprar'
        };

        // Evento de clique para o botão 'anterior'
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + itemArray.length) % itemArray.length;
            showItems();
        });

        // Evento de clique para o botão 'próximo'
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % itemArray.length;
            showItems();
        });

        // Inicializa o slider com os itens visíveis e aplica os listeners
        showItems();
    });

    // Funções para aumentar e diminuir quantidade
    document.querySelectorAll('.quantity-selector').forEach(selector => {
        const input = selector.querySelector('input');
        const decreaseBtn = selector.querySelector('.decrease');
        const increaseBtn = selector.querySelector('.increase');

        decreaseBtn.addEventListener('click', () => {
            let value = parseInt(input.value, 10);
            if (value > 1) input.value = value - 1;
        });

        increaseBtn.addEventListener('click', () => {
            let value = parseInt(input.value, 10);
            input.value = value + 1;
        });
    });

    // Função para adicionar ao carrinho
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.getAttribute('data-id');
            const quantityInput = btn.closest('.product-item').querySelector('input[type="number"]');
            const quantity = quantityInput ? quantityInput.value : 1;

            console.log('ID do produto:', productId);
            console.log('Quantidade:', quantity);

            const loggedIn = localStorage.getItem('loggedIn') === 'true';

            if (!loggedIn) {
                document.getElementById('modal-login').style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`/cart/add/${productId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ quantity })
                });

                const result = await response.json();

                if (response.status === 401) {
                    document.getElementById('modal-login').style.display = 'block';
                } else if (response.ok) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                    mostrarMensagem(result.message || 'Produto adicionado ao carrinho com sucesso!');
                } else {
                    mostrarMensagem(result.message || 'Erro ao adicionar produto ao carrinho.');
                }
            } catch (error) {
                console.error(error);
                mostrarMensagem('Erro ao adicionar produto ao carrinho.');
            }
        });
    });

    // Função para mostrar mensagens
    function mostrarMensagem(mensagem) {
        const mensagemContainer = document.getElementById('mensagem');
        mensagemContainer.textContent = mensagem;
        mensagemContainer.style.display = 'block';
        mensagemContainer.style.opacity = 1; // Torna visível

        setTimeout(() => {
            mensagemContainer.style.opacity = 0; // Faz a mensagem desaparecer
            setTimeout(() => {
                mensagemContainer.style.display = 'none'; // Esconde após a animação
            }, 500); // Espera a animação de opacidade terminar
        }, 3000); // Exibe a mensagem por 3 segundos
    }

    // Fecha o modal quando o botão "Continuar Olhando" for clicado
    document.querySelector('.btn-continue').addEventListener('click', () => {
        document.getElementById('modal-login').style.display = 'none';
    });

    // Salva o status de login quando o usuário faz login (exemplo)
    function setLoginStatus(loggedIn) {
        localStorage.setItem('loggedIn', loggedIn ? 'true' : 'false');
    }

    // Exemplo de uso após o login:
    setLoginStatus(true); // Defina como "false" quando o usuário fizer logout
});