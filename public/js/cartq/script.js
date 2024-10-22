document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();  // Previna o comportamento padrão do botão

            const productId = e.target.getAttribute('data-id');
            const action = e.target.getAttribute('data-action');
            const span = document.querySelector(`.quantity-input[data-id="${productId}"]`);
            let currentQuantity = parseInt(span.innerText);

            if (action === 'increase') {
                currentQuantity += 1;
            } else if (action === 'decrease' && currentQuantity > 1) {
                currentQuantity -= 1;
            }

            span.innerText = currentQuantity;  // Atualiza o campo de quantidade

            // Atualiza a quantidade no servidor via POST
            try {
                const response = await fetch(`/cart/update-quantity/${productId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ quantity: currentQuantity }),
                });

                const data = await response.json();

                if (data.success) {
                    // Atualiza o total do carrinho no frontend
                    document.querySelector(`#cart-total`).innerText = `Total: R$ ${data.total}`;
                    
                    // Atualiza o total do item no frontend
                    const itemTotal = document.querySelector(`.cart-item[data-id="${productId}"] .total-price`);
                    const price = parseFloat(document.querySelector(`.cart-item[data-id="${productId}"]`).getAttribute('data-price'));
                    itemTotal.innerText = `Total: R$ ${(price * currentQuantity).toFixed(2)}`;
                }
            } catch (error) {
                console.error('Erro ao atualizar quantidade:', error);
            }
            window.location.reload();
        });
    });
});

//---------------------------------------------------------------

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

//------------------------Carrinho---------------------------------

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