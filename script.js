// ==========================================================
// 1. CONFIGURAÇÃO INICIAL, DADOS E LOCALSTORAGE
// ==========================================================

// Configurações de Login (APENAS PARA DEMONSTRAÇÃO)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'thiely123'; // Senha de demonstração

const STORAGE_KEY = 'thielyStoreProducts';

// Dados iniciais (Placeholder - Serão substituídos pelos uploads)
const INITIAL_PRODUCTS = [
    { id: 1, name: "Vestido Rosa Chá", price: 199.90, category: "vestidos", imageSource: 'https://via.placeholder.com/280x350/E57373/FFFFFF?text=Look+Inicial+1' },
    { id: 2, name: "Blusa Casual Chic", price: 79.90, category: "blusas", imageSource: 'https://via.placeholder.com/280x350/880E4F/FFFFFF?text=Look+Inicial+2' },
];

let products = loadProductsFromStorage();
let cart = []; 

// Elementos DOM (Acessados globalmente para loja e admin)
const productsContainer = document.getElementById('products-container');
const categoriesList = document.querySelector('.categories ul');
const cartSidebar = document.getElementById('cart-sidebar');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const cartCountSpan = document.getElementById('cart-count');
const emptyCartMessage = document.getElementById('empty-cart-message');


// Gerenciamento de Dados (LocalStorage)
function loadProductsFromStorage() {
    const storedProducts = localStorage.getItem(STORAGE_KEY);
    if (storedProducts) {
        return JSON.parse(storedProducts);
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
        return INITIAL_PRODUCTS;
    }
}

function saveProductsToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}


// ==========================================================
// 2. FUNÇÕES DE ADMINISTRAÇÃO (admin.html)
// ==========================================================

function setupAdminPage() {
    // CORREÇÃO: Esta função só deve rodar se o elemento admin-body existir
    if (!document.body || !document.body.classList.contains('admin-body')) return; 

    const loginSection = document.getElementById('admin-login');
    const productSection = document.getElementById('add-product-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const addForm = document.getElementById('add-product-form');


    // Garante que o estado de login é checado no início
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    } else {
        showLoginPage();
    }

    // Event Listeners
    loginForm?.addEventListener('submit', handleLogin);
    logoutBtn?.addEventListener('click', handleLogout);
    addForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        processNewProduct();
    });

    function handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        const msg = document.getElementById('login-message');

        if (user === ADMIN_USER && pass === ADMIN_PASS) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showAdminPanel();
        } else {
            msg.textContent = 'Usuário ou senha incorretos.';
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('adminLoggedIn');
        showLoginPage();
    }


    function showLoginPage() {
        loginSection.style.display = 'block';
        productSection.style.display = 'none';
    }

    function showAdminPanel() {
        loginSection.style.display = 'none';
        productSection.style.display = 'block';
        // Recarrega os produtos do storage
        products = loadProductsFromStorage(); 
        renderAdminProducts(); 
    }
}

// NOVO: Função para converter o arquivo para Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// NOVO: Processa o formulário de adição de produto com a conversão de imagem
async function processNewProduct() {
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value.toLowerCase().replace(/\s/g, '-');
    const imageFileElement = document.getElementById('product-image-file');
    const msg = document.getElementById('add-message');

    if (imageFileElement.files.length === 0) {
        msg.textContent = 'Por favor, anexe um arquivo de imagem.';
        return;
    }

    const imageFile = imageFileElement.files[0];
    
    // Limite o tamanho para não estourar o localStorage (2MB)
    if (imageFile.size > 2000000) { 
        msg.textContent = 'A imagem é muito grande. Use arquivos menores que 2MB.';
        return;
    }

    try {
        const base64Image = await fileToBase64(imageFile);

        // Gera o novo ID e cria o produto
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = {
            id: newId,
            name: name,
            price: price,
            category: category,
            imageSource: base64Image 
        };

        products.push(newProduct);
        saveProductsToStorage();

        msg.textContent = `Produto "${name}" adicionado e imagem salva!`;
        document.getElementById('add-product-form').reset();
        renderAdminProducts();
    } catch (error) {
        msg.textContent = 'Erro ao processar a imagem. Tente novamente.';
        console.error('Erro de Base64:', error);
    }
}

function deleteProduct(id) {
    if (confirm(`Tem certeza que deseja remover o produto ID ${id}?`)) {
        products = products.filter(p => p.id !== id);
        saveProductsToStorage();
        renderAdminProducts();
    }
}

function renderAdminProducts() {
    const listElement = document.getElementById('current-products-list');
    if (!listElement) return;

    listElement.innerHTML = '';

    products.forEach(product => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>ID ${product.id} | ${product.name} (R$ ${product.price.toFixed(2)}) [${product.category}]</span>
            <button onclick="deleteProduct(${product.id})">Remover</button>
        `;
        listElement.appendChild(li);
    });
    window.deleteProduct = deleteProduct; 
}


// ==========================================================
// 3. FUNÇÕES DA LOJA (index.html) - LOGICA PRINCIPAL
// ==========================================================

function formatCategoryName(slug) {
    if (slug === 'todos') return 'Todos os Looks';
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function generateCategoryButtons() {
    if (!categoriesList) return; 
    
    products = loadProductsFromStorage();
    const uniqueCategories = ['todos', ...new Set(products.map(p => p.category))];
    categoriesList.innerHTML = '';
    
    uniqueCategories.forEach(category => {
        const displayName = formatCategoryName(category);
        const listItem = document.createElement('li');
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.dataset.category = category;
        button.textContent = displayName;
        button.addEventListener('click', filterProducts);
        listItem.appendChild(button);
        categoriesList.appendChild(listItem);
    });

    const allButton = categoriesList.querySelector('.filter-btn[data-category="todos"]');
    if (allButton) allButton.classList.add('active');
}

function renderProducts(filteredProducts = products) {
    if (!productsContainer) return;
    
    productsContainer.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = '<p style="text-align: center; width: 100%;">Nenhum produto encontrado nesta categoria. Tente outro look!</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const imageSource = product.imageSource;

        card.innerHTML = `
            <img src="${imageSource}" alt="${product.name}" onerror="if(!this.src.startsWith('data:')){this.src='https://via.placeholder.com/280x350/E57373/FFFFFF?text=Thiely+Store'}">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                <button class="add-to-cart-btn" data-id="${product.id}">Adicionar à Sacola</button>
            </div>
        `;
        productsContainer.appendChild(card);
    });
    
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            addToCart(productId);
        });
    });
}

// ... (Resto das funções de Carrinho, Filtro e Checkout - Mantidas)

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

function renderCart() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
    } else {
        if (emptyCartMessage) emptyCartMessage.style.display = 'none';
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                total += product.price * item.quantity;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = `
                    <div class="item-details">
                        <p class="name">${product.name}</p>
                        <p>${item.quantity} x R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="remove-item-btn" data-id="${product.id}" onclick="removeFromCart(${product.id})">Remover</button>
                `;
                cartItemsContainer.appendChild(itemDiv);
            }
        });
    }
    
    if (cartTotalSpan) cartTotalSpan.textContent = total.toFixed(2).replace('.', ',');
    if (cartCountSpan) cartCountSpan.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function addToCart(productId) {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) existingItem.quantity++;
    else cart.push({ id: productId, quantity: 1 });
    renderCart();
    if (cartSidebar) cartSidebar.classList.add('open');
}

function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity--;
        if (cart[itemIndex].quantity <= 0) cart.splice(itemIndex, 1);
    }
    renderCart();
}

function iniciarCheckout(method) {
    const totalText = document.getElementById('cart-total').textContent;
    const total = parseFloat(totalText.replace(',', '.'));
    
    if (total === 0) {
        alert('Sua sacola está vazia. Adicione um produto antes de finalizar.');
        return;
    }

    alert(`Iniciando Checkout Thiely Store com ${method}.
    Total: R$ ${totalText}`);

    if (confirm("Simular pagamento aprovado e pedido realizado?")) {
        alert("✅ Pedido Thiely Store finalizado! Agradecemos a sua compra.");
        cart = [];
        renderCart();
        if (cartSidebar) cartSidebar.classList.remove('open');
    }
}
window.iniciarCheckout = iniciarCheckout;


// --- Lógica do Carrinho Lateral ---
document.getElementById('toggle-cart')?.addEventListener('click', () => {
    if (cartSidebar) cartSidebar.classList.toggle('open');
});

document.getElementById('close-cart')?.addEventListener('click', () => {
    if (cartSidebar) cartSidebar.classList.remove('open');
});

// ==========================================================
// 4. INICIALIZAÇÃO GERAL
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a lógica de administração (executa apenas em admin.html)
    setupAdminPage();
    
    // Inicializa a lógica da loja (executa apenas em index.html)
    if (document.getElementById('products-container')) {
        products = loadProductsFromStorage();
        generateCategoryButtons();
        renderProducts();
        renderCart();
    }
});