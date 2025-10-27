// ==========================================================
// 3. FUNÇÕES DE INTERAÇÃO E NOVO CHECKOUT WHATSAPP
// ==========================================================

function filterProducts(e) {
    const category = e.target.dataset.category;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    let filtered = products;
    if (category !== 'todos') {
        filtered = products.filter(product => product.category === category);
    }
    
    renderProducts(filtered);
}

function addToCart(productId) {
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    renderCart();
    if (cartSidebar) cartSidebar.classList.add('open');
}

function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity--;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    renderCart();
}

// --- NOVO CHECKOUT PARA WHATSAPP ---
function iniciarCheckout(method) {
    const totalText = document.getElementById('cart-total').textContent;
    const total = parseFloat(totalText.replace(',', '.'));
    
    if (total === 0) {
        alert('Sua sacola está vazia. Adicione um produto antes de finalizar.');
        return;
    }

    // 1. Número de telefone da loja (MUDAR PARA SEU NÚMERO)
    const storePhoneNumber = '5583987468688'; // Ex: 55 + DDD + Número

    // 2. Monta a lista de itens para a mensagem
    let message = `🛍️ NOVO PEDIDO - Thiely Store 🛍️\n\n`;
    message += `*Método de Pagamento Sugerido:* ${method}\n\n`;
    message += `*ITENS DO PEDIDO:*\n`;
    
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            message += `${item.quantity}x ${product.name} (R$ ${product.price.toFixed(2).replace('.', ',')})\n`;
        }
    });

    message += `\n*VALOR TOTAL:* R$ ${totalText}`;
    message += `\n\nOlá! Gostaria de confirmar meu pedido e receber o link/QR Code para pagamento via ${method}.`;

    // 3. Codifica a mensagem e cria o link do WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${storePhoneNumber}&text=${encodedMessage}`;

    // 4. Abre o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');

    alert(`Seu pedido foi enviado para o WhatsApp da Thiely Store!
    
    Aguarde a resposta para receber o código PIX ou o link de pagamento por Cartão.`);

    // Opcional: Limpar o carrinho após enviar, simulando o checkout.
    cart = [];
    renderCart();
    if (cartSidebar) cartSidebar.classList.remove('open');
}
window.iniciarCheckout = iniciarCheckout; 

// --- Lógica do Carrinho Lateral (Mantida) ---
document.getElementById('toggle-cart')?.addEventListener('click', () => {
    if (cartSidebar) cartSidebar.classList.toggle('open');
});

document.getElementById('close-cart')?.addEventListener('click', () => {
    if (cartSidebar) cartSidebar.classList.remove('open');
});

// Outras funções (renderCart, etc.) devem ser mantidas da versão anterior.

// Assegure-se de que a função renderCart esteja completa e funcional em seu arquivo:

// function renderCart() { ... } 
// function renderProducts() { ... }
// ...
