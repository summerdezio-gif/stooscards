// ============================================
// 🚀 POKÉMON TCG VAULT - APP.JS
// ============================================

// 🔑 CONFIG SUPABASE
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';
const { createClient } = window.supabase;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 💾 STATE
let allCards = [];
let filteredCards = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentFilter = 'all';
let currentCard = null;

// ============================
// 📱 DOM ELEMENTS
// ============================

const cardsGrid = document.getElementById('cardsGrid');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const navLinks = document.querySelectorAll('.nav-link');
const cardModal = document.getElementById('cardModal');
const modalClose = document.querySelector('.modal-close');
const cartSidebar = document.getElementById('cartSidebar');
const cartLink = document.getElementById('cart-link');
const closeCart = document.querySelector('.close-cart');
const cartItems = document.getElementById('cartItems');
const addToCartBtn = document.getElementById('addToCartBtn');
const toggleFavBtn = document.getElementById('toggleFavBtn');
const adminPanel = document.getElementById('adminPanel');
const adminToggle = document.getElementById('admin-toggle');
const adminClose = document.querySelector('.admin-close');
const overlay = document.getElementById('overlay');
const addCardForm = document.getElementById('addCardForm');
const adminTabs = document.querySelectorAll('.admin-tab');
const adminContents = document.querySelectorAll('.admin-content');

// ============================
// 🎯 INITIALIZATION
// ============================

async function init() {
    try {
        console.log('🚀 Initialization...');
        
        // Charger les cartes
        await loadCards();
        
        // Afficher les cartes
        renderCards(allCards);
        
        // Bind events
        bindEvents();
        
        // Charger le panier
        updateCartUI();
        
        console.log('✅ Ready!');
    } catch (error) {
        console.error('❌ Erreur init:', error);
    }
}

// ============================
// 📥 LOAD CARDS FROM SUPABASE
// ============================

async function loadCards() {
    try {
        const { data, error } = await supabase
            .from('cards')
            .select('*');

        if (error) throw error;
        
        allCards = data || [];
        filteredCards = allCards;
        
        console.log(`✅ ${allCards.length} cartes chargées`);
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        // Mode offline avec données exemple
        loadMockCards();
    }
}

// Mock data (si pas de Supabase)
function loadMockCards() {
    allCards = [
        {
            id: 1,
            name: 'Pikachu EX',
            type: 'pokemon',
            rarity: 'rare',
            price: 45.99,
            description: 'Électrique légendaire avec attaque puissante',
            image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=600&fit=crop'
        },
        {
            id: 2,
            name: 'Charizard GX',
            type: 'pokemon',
            rarity: 'legendary',
            price: 120.00,
            description: 'Dragon de feu rare et puissant',
            image: 'https://images.unsplash.com/photo-1613387573392-4921cffb38f8?w=500&h=600&fit=crop'
        },
        {
            id: 3,
            name: 'Potion',
            type: 'trainer',
            rarity: 'common',
            price: 8.99,
            description: 'Récupère 20 PV',
            image: 'https://images.unsplash.com/photo-1576089160550-2173dba999ef?w=500&h=600&fit=crop'
        },
        {
            id: 4,
            name: 'Electric Energy',
            type: 'energy',
            rarity: 'common',
            price: 5.99,
            description: 'Énergie électrique basique',
            image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=500&h=600&fit=crop'
        },
        {
            id: 5,
            name: 'Blastoise V',
            type: 'pokemon',
            rarity: 'rare',
            price: 35.99,
            description: 'Pokémon Eau puissant',
            image: 'https://images.unsplash.com/photo-1599720575179-d3d6fcb5df86?w=500&h=600&fit=crop'
        },
        {
            id: 6,
            name: 'Mewtwo GX',
            type: 'pokemon',
            rarity: 'legendary',
            price: 150.00,
            description: 'Pokémon psychique surpuissant',
            image: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b3?w=500&h=600&fit=crop'
        }
    ];
    filteredCards = allCards;
}

// ============================
// 🎨 RENDER CARDS
// ============================

function renderCards(cards) {
    cardsGrid.innerHTML = '';
    
    if (cards.length === 0) {
        cardsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a0a0a0; padding: 3rem;">Aucune carte trouvée...</p>';
        return;
    }

    cards.forEach(card => {
        const cardEl = createCardElement(card);
        cardsGrid.appendChild(cardEl);
    });
}

function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <div class="card-image">
            <img src="${card.image}" alt="${card.name}" loading="lazy">
        </div>
        <div class="card-content">
            <h3 class="card-title">${card.name}</h3>
            <div class="card-meta">
                <span class="card-type">${card.type}</span>
                <span class="card-price">${card.price.toFixed(2)}€</span>
            </div>
        </div>
    `;

    div.addEventListener('click', () => openCardModal(card));
    return div;
}

// ============================
// 📋 MODAL DÉTAIL
// ============================

function openCardModal(card) {
    currentCard = card;
    
    document.getElementById('modalImage').src = card.image;
    document.getElementById('modalName').textContent = card.name;
    document.getElementById('modalType').textContent = `Type: ${card.type}`;
    document.getElementById('modalDesc').textContent = card.description;
    document.getElementById('modalRarity').textContent = card.rarity.toUpperCase();
    document.getElementById('modalPrice').textContent = `${card.price.toFixed(2)}€`;
    
    // Update fav btn
    const isFav = favorites.some(f => f.id === card.id);
    toggleFavBtn.textContent = isFav ? '❤️ Dans les favoris' : '🤍 Ajouter aux favoris';
    
    cardModal.classList.add('active');
    overlay.classList.add('active');
}

function closeCardModal() {
    cardModal.classList.remove('active');
    overlay.classList.remove('active');
    currentCard = null;
}

// ============================
// 🛒 CART FUNCTIONS
// ============================

function addToCart() {
    if (!currentCard) return;
    
    const existingItem = cart.find(item => item.id === currentCard.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...currentCard,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    
    // Feedback
    addToCartBtn.textContent = '✅ Ajouté!';
    setTimeout(() => {
        addToCartBtn.textContent = 'Ajouter au panier';
    }, 1500);
}

function removeFromCart(cardId) {
    cart = cart.filter(item => item.id !== cardId);
    saveCart();
    updateCartUI();
}

function updateQuantity(cardId, change) {
    const item = cart.find(item => item.id === cardId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(cardId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').textContent = total.toFixed(2) + '€';
    
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #a0a0a0;">Panier vide</p>';
        return;
    }
    
    cart.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price.toFixed(2)}€</div>
                <div class="cart-item-qty">
                    <button class="qty-btn" data-id="${item.id}" data-action="minus">−</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" data-id="${item.id}" data-action="plus">+</button>
                    <button class="remove-item" data-id="${item.id}">Supprimer</button>
                </div>
            </div>
        `;
        cartItems.appendChild(itemEl);
    });
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ============================
// ❤️ FAVORITES
// ============================

function toggleFavorite() {
    if (!currentCard) return;
    
    const index = favorites.findIndex(f => f.id === currentCard.id);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(currentCard);
    }
    
    saveFavorites();
    toggleFavBtn.textContent = index > -1 ? '🤍 Ajouter aux favoris' : '❤️ Dans les favoris';
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// ============================
// 🔍 SEARCH & FILTER
// ============================

function filterCards() {
    let result = allCards;
    
    // Filter par type
    if (currentFilter !== 'all') {
        result = result.filter(card => card.type === currentFilter || card.rarity === currentFilter);
    }
    
    // Search
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        result = result.filter(card => 
            card.name.toLowerCase().includes(searchTerm) ||
            card.description.toLowerCase().includes(searchTerm)
        );
    }
    
    filteredCards = result;
    renderCards(filteredCards);
}

// ============================
// ⚙️ ADMIN FUNCTIONS
// ============================

async function addCard(e) {
    e.preventDefault();
    
    const name = document.getElementById('cardName').value;
    const type = document.getElementById('cardType').value;
    const rarity = document.getElementById('cardRarity').value;
    const price = parseFloat(document.getElementById('cardPrice').value);
    const description = document.getElementById('cardDesc').value;
    const imageFile = document.getElementById('cardImage').files[0];
    
    if (!imageFile) {
        alert('Selectionne une image!');
        return;
    }
    
    try {
        // Upload image
        const fileName = `card-${Date.now()}-${imageFile.name}`;
        const { data: imageData, error: imageError } = await supabase.storage
            .from('cards')
            .upload(fileName, imageFile);
        
        if (imageError) throw imageError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('cards')
            .getPublicUrl(fileName);
        
        // Add card to DB
        const { data, error } = await supabase
            .from('cards')
            .insert({
                name,
                type,
                rarity,
                price,
                description,
                image: publicUrl
            });
        
        if (error) throw error;
        
        alert('✅ Carte ajoutée!');
        addCardForm.reset();
        
        // Reload cards
        await loadCards();
        renderCards(filteredCards);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur: ' + error.message);
    }
}

async function deleteCard(cardId) {
    if (!confirm('Supprimer vraiment?')) return;
    
    try {
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', cardId);
        
        if (error) throw error;
        
        await loadCards();
        renderCards(filteredCards);
        loadAdminList();
        
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        alert('Erreur: ' + error.message);
    }
}

async function loadAdminList() {
    const adminList = document.getElementById('adminList');
    adminList.innerHTML = '';
    
    allCards.forEach(card => {
        const el = document.createElement('div');
        el.className = 'admin-card';
        el.innerHTML = `
            <div class="admin-card-image">
                <img src="${card.image}" alt="${card.name}">
            </div>
            <div class="admin-card-info">
                <div class="admin-card-name">${card.name}</div>
                <div class="admin-card-details">
                    Type: ${card.type} | Rareté: ${card.rarity} | ${card.price.toFixed(2)}€
                </div>
            </div>
            <div class="admin-card-actions">
                <button class="admin-btn admin-btn-edit" onclick="alert('Coming soon!')">Edit</button>
                <button class="admin-btn admin-btn-delete" data-id="${card.id}">Delete</button>
            </div>
        `;
        
        el.querySelector('.admin-btn-delete').addEventListener('click', () => deleteCard(card.id));
        adminList.appendChild(el);
    });
}

// ============================
// 🎯 EVENT BINDINGS
// ============================

function bindEvents() {
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterCards();
        });
    });
    
    // Nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            if (filter) {
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = filter;
                
                if (filter === 'favorites') {
                    renderCards(favorites);
                } else {
                    filterCards();
                }
            }
        });
    });
    
    // Search
    searchInput.addEventListener('input', filterCards);
    
    // Modal
    modalClose.addEventListener('click', closeCardModal);
    overlay.addEventListener('click', closeCardModal);
    addToCartBtn.addEventListener('click', addToCart);
    toggleFavBtn.addEventListener('click', toggleFavorite);
    
    // Cart
    cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        cartSidebar.classList.add('active');
        overlay.classList.add('active');
    });
    
    closeCart.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    // Cart items events
    cartItems.addEventListener('click', (e) => {
        if (e.target.classList.contains('qty-btn')) {
            const id = parseInt(e.target.dataset.id);
            const action = e.target.dataset.action;
            updateQuantity(id, action === 'plus' ? 1 : -1);
        }
        if (e.target.classList.contains('remove-item')) {
            const id = parseInt(e.target.dataset.id);
            removeFromCart(id);
        }
    });
    
    // Admin
    adminToggle.addEventListener('click', (e) => {
        e.preventDefault();
        adminPanel.classList.add('active');
        overlay.classList.add('active');
        loadAdminList();
    });
    
    adminClose.addEventListener('click', () => {
        adminPanel.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    // Admin tabs
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            adminTabs.forEach(t => t.classList.remove('active'));
            adminContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.dataset.tab + 'Tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Admin form
    addCardForm.addEventListener('submit', addCard);
    
    // Close all on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            cardModal.classList.remove('active');
            cartSidebar.classList.remove('active');
            adminPanel.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
}

// ============================
// 🚀 START
// ============================

document.addEventListener('DOMContentLoaded', init);
