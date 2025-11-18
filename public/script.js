// Referencias a elementos del DOM
const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const storeFilter = document.getElementById("storeFilter");
const sortBy = document.getElementById("sortBy");
const loadMoreBtn = document.getElementById("loadMore");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

// Variables
let page = 0;
const pageSize = 12;
let currentStore = "";
let currentSort = "";
let isSearching = false;

// ------------------------------
// FUNCIONES PRINCIPALES
// ------------------------------

// 1️ Mostrar estado (Cargando, Error, etc.)
function setStatus(msg) {
    statusEl.textContent = msg;
}

// 2️ Llamar a la API CheapShark
async function fetchDeals(page = 0, storeID = "") {
    try {
        setStatus("Cargando juegos...");
        const url = `https://www.cheapshark.com/api/1.0/deals?pageNumber=${page}&pageSize=20${storeID ? `&storeID=${storeID}` : ""}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Error al conectar con la API");

        const data = await res.json();
        setStatus("");
        return data;
    } catch (err) {
        console.error(err);
        setStatus("❌ Error al cargar datos.");
        return [];
    }
}

// 3️ Renderizar tarjetas de juegos
function renderGames(games, reset = false) {
    if (reset) grid.innerHTML = "";

    games.forEach(game => {
        const card = document.createElement("div");
        card.className = "bg-white p-4 rounded shadow hover:shadow-lg transition";

        card.innerHTML = `
            <img src="${game.thumb}" class="w-full h-40 object-cover rounded" />
            <h3 class="mt-2 font-bold">${game.title}</h3>
            <p class="text-green-700 font-semibold">Oferta: $${game.salePrice}</p>
            <p class="text-gray-600 text-sm">Precio normal: $${game.normalPrice}</p>

            <button 
                class="mt-3 bg-blue-600 text-white px-3 py-1 rounded viewDetail"
                data-id="${game.dealID}">
                Ver detalle
            </button>
        `;

        grid.appendChild(card);
    });
}

// 4️ Abrir modal con más información
async function openModal(id) {
    modal.classList.remove("hidden");

    modalContent.innerHTML = "<p>Cargando detalles...</p>";

    const res = await fetch(`https://www.cheapshark.com/api/1.0/deals?id=${id}`);
    const data = await res.json();

    modalContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-2">${data.gameInfo.name}</h2>

        <img src="${data.gameInfo.thumb}" class="w-full h-56 object-cover rounded mb-4">

        <p><strong>Precio oferta:</strong> $${data.gameInfo.salePrice}</p>
        <p><strong>Precio normal:</strong> $${data.gameInfo.retailPrice}</p>
        <p><strong>Metacritic:</strong> ${data.gameInfo.metacriticScore}</p>

        <a href="${data.gameInfo.storeLink}" target="_blank" 
           class="block mt-4 bg-green-600 text-white p-2 rounded text-center">
           Ver en tienda
        </a>

        <button class="mt-6 bg-red-600 text-white p-2 rounded closeModal">
            Cerrar
        </button>
    `;
}

// 5️ Cerrar modal
modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("closeModal") || e.target === modal) {
        modal.classList.add("hidden");
    }
});

// 6️ Ordenar juegos por precio
function sortGames(games, criteria) {
    if (criteria === "price") {
        return games.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice));
    }
    if (criteria === "normalPrice") {
        return games.sort((a, b) => parseFloat(a.normalPrice) - parseFloat(b.normalPrice));
    }
    return games;
}

// ------------------------------
// EVENTOS
// ------------------------------

// Botón BUSCAR
searchBtn.addEventListener("click", async () => {
    const text = searchInput.value.trim();

    if (text.length === 0) return;

    setStatus("Buscando...");
    isSearching = true;

    const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${text}&limit=20`);
    const data = await res.json();

    setStatus("");

    // Convertir formato a tarjetas compatibles
    const games = data.map(g => ({
        title: g.external,
        thumb: g.thumb,
        salePrice: "—",
        normalPrice: "—",
        dealID: g.cheapestDealID
    }));

    renderGames(games, true);
});

// Filtro por tienda
storeFilter.addEventListener("change", async () => {
    currentStore = storeFilter.value;
    page = 0;
    const games = await fetchDeals(0, currentStore);
    renderGames(games, true);
});

// Ordenar
sortBy.addEventListener("change", async () => {
    currentSort = sortBy.value;
    const games = await fetchDeals(0, currentStore);
    renderGames(sortGames(games, currentSort), true);
});

// Cargar más
loadMoreBtn.addEventListener("click", async () => {
    page++;
    const games = await fetchDeals(page, currentStore);
    renderGames(games);
});

// Abrir modal
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("viewDetail")) {
        const id = e.target.dataset.id;
        openModal(id);
    }
});

// ------------------------------
// CARGA INICIAL
// ------------------------------
(async () => {
    const games = await fetchDeals();
    renderGames(games);
})();
