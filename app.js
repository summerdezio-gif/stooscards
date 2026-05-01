// app.js

// Configuration Supabase
const SUPABASE_URL = 'https://bykkzjlfnhosjtvxfutw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5a2t6amxmbmhvc2p0dnhmdXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODUyNTUsImV4cCI6MjA5MzE2MTI1NX0.ITKVkjp3t0lbhvr2GmOZsJIem6ic_9VqMmreFt5MaTs';

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allCards = [];
let filteredCards = [];

// DOM Elements
const cardsGrid = document.getElementById('cardsGrid');
const addCardBtn = document.getElementById('addCardBtn');
const adminModal = document.getElementById('adminModal');
const closeBtn = document.querySelector('.close-btn');
const cardForm = document.getElementById('cardForm');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const rarityFilter = document.getElementById('rarityFilter');
const cardImageInput = document.getElementById('cardImage');
const imagePreview = document.getElementById('imagePreview');

// Événements
addCardBtn.addEventListener('click', () => adminModal.classList.remove('hidden'));
closeBtn.addEventListener('click', () => adminModal.classList.add('hidden'));
cardForm.addEventListener('submit', handleAddCard);
cardImageInput.addEventListener('change', handleImagePreview);
searchInput.addEventListener('input', filterCards);
typeFilter.addEventListener('change', filterCards);
rarityFilter.addEventListener('change', filterCards);

// Prévisualisation image
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.innerHTML = `<img src="${event.target.result}" alt="preview">`;
        };
        reader.readAsDataURL(file);
    }
}

// Charger les cartes
async function loadCards() {
    try {
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        allCards = data || [];
        filteredCards = [...allCards];
        displayCards(filteredCards);
        displayTopCard();
    } catch (error) {
        console.error('Erreur:', error);
        cardsGrid.innerHTML = '<p>Erreur lors du chargement des cartes</p>';
    }
}

// Afficher les cartes
function displayCards(cards) {
    cardsGrid.innerHTML = cards.length > 0 
        ? cards.map(card => `
            <div class="card-item">
                <div class="card-image">
                    <img src="${card.image_url}" alt="${card.name}" onerror="this.src='https://via.placeholder.com/220x280?text=No+Image'">
                </div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="card-name">${card.name}</div>
                        <div class="card-dresseur">${card.dresseur}</div>
                    </div>
                    <span class="card-type">${card.type}</span>
                    <div class="card-meta">
                        <span class="card-pv">${card.pv} PV</span>
                        <span class="card-rarity">${card.rarity}</span>
                    </div>
                    <div class="card-price">${card.price}€</div>
                    <div class="card-actions">
                        <button class="btn-action" onclick="editCard(${card.id})">✏️ Éditer</button>
                        <button class="btn-action" onclick="deleteCard(${card.id})">🗑️ Supprimer</button>
                        <button class="btn-heart btn-action" onclick="toggleLike(${card.id})">❤️</button>
                    </div>
                </div>
            </div>
        `).join('')
        : '<p style="grid-column: 1/-1; text-align: center;">Aucune carte trouvée</p>';
}

// Afficher la carte de la semaine
function displayTopCard() {
    const topCardContainer = document.getElementById('topCard');
    if (allCards.length === 0) return;

    const topCard = allCards[0]; // La plus récente
    topCardContainer.innerHTML = `
        <div class="top-card">
            <div class="top-card-image">
                <img src="${topCard.image_url}" alt="${topCard.name}" onerror="this.src='https://via.placeholder.com/280x380?text=No+Image'">
            </div>
            <div class="top-card-info">
                <h2>${topCard.name}</h2>
                <p>${topCard.description || 'Une carte exceptionnelle de notre collection'}</p>
                <div class="card-stats">
                    <div class="stat">
                        <div class="stat-label">PV</div>
                        <div class="stat-value">${topCard.pv}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Type</div>
                        <div class="stat-value">${topCard.type.toUpperCase().substring(0, 3)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Prix</div>
                        <div class="stat-value">${topCard.price}€</div>
                    </div>
                </div>
                <button class="btn-add" style="width: 100%;">🛒 Acheter maintenant</button>
            </div>
        </div>
    `;
}

// Ajouter une carte
async function handleAddCard(e) {
    e.preventDefault();

    const file = cardImageInput.files[0];
    if (!file) {
        alert('Veuillez sélectionner une image');
        return;
    }

    try {
        // Upload image vers Supabase Storage
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('cards-images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Obtenir l'URL publique
        const { data } = supabase.storage
            .from('cards-images')
            .getPublicUrl(fileName);

        const imageUrl = data.publicUrl;

        // Insérer la carte dans la DB
        const { error: insertError } = await supabase
            .from('cards')
            .insert([{
                name: document.getElementById('cardName').value,
                dresseur: document.getElementById('cardDresseur').value,
                type: document.getElementById('cardType').value,
                rarity: document.getElementById('cardRarity').value,
                pv: parseInt(document.getElementById('cardPV').value),
                price: parseFloat(document.getElementById('cardPrice').value),
                image_url: imageUrl,
                description: document.getElementById('cardDescription').value,
                created_at: new Date().toISOString()
            }]);

        if (insertError) throw insertError;

        alert('✅ Carte ajoutée avec succès !');
        cardForm.reset();
        imagePreview.innerHTML = '';
        adminModal.classList.add('hidden');
        loadCards();
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur : ' + error.message);
    }
}

// Éditer une carte
async function editCard(id) {
    const card = allCards.find(c => c.id === id);
    if (!card) return;

    const newPrice = prompt('Nouveau prix (€):', card.price);
    if (newPrice === null) return;

    try {
        const { error } = await supabase
            .from('cards')
            .update({ price: parseFloat(newPrice) })
            .eq('id', id);

        if (error) throw error;

        alert('✅ Carte mise à jour !');
        loadCards();
    } catch (error) {
        alert('❌ Erreur : ' + error.message);
    }
}

// Supprimer une carte
async function deleteCard(id) {
    if (!confirm('Êtes-vous sûr ?')) return;

    try {
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('✅ Carte supprimée !');
        loadCards();
    } catch (error) {
        alert('❌ Erreur : ' + error.message);
    }
}

// Filtrer les cartes
function filterCards() {
    const searchTerm = searchInput.value.toLowerCase();
    const typeValue = typeFilter.value;
    const rarityValue = rarityFilter.value;

    filteredCards = allCards.filter(card => {
        const matchSearch = card.name.toLowerCase().includes(searchTerm) || 
                           card.dresseur.toLowerCase().includes(searchTerm);
        const matchType = !typeValue || card.type === typeValue;
        const matchRarity = !rarityValue || card.rarity === rarityValue;

        return matchSearch && matchType && matchRarity;
    });

    displayCards(filteredCards);
}

// Like/Unlike
function toggleLike(id) {
    const btn = event.target.closest('.btn-heart');
    btn.classList.toggle('liked');
    // À implémenter : sauvegarder les likes dans la DB
}

// Initialiser l'app
loadCards();

// Auto-refresh chaque 30 secondes
setInterval(loadCards, 30000);
