
const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const errorMsg = document.getElementById("errorMsg");
const noResults = document.getElementById("noResults");
const spinner = document.getElementById("spinner");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const storeFilter = document.getElementById("storeFilter");
const sortBy = document.getElementById("sortBy");
const loadMoreBtn = document.getElementById("loadMore");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");


let page = 0;
const pageSize = 20; 
let currentStore = "";
let currentSort = "";
let isSearching = false;
 function setStatus(msg) {
    statusEl.textContent = msg;
}


spinner.classList.remove("hidden");
errorMsg.classList.add("hidden");

async function fetchDeals(page = 0, storeID = "") {
    try {
        setStatus("Cargando juegos...");
        
        const url = `https://www.cheapshark.com/api/1.0/deals?pageNumber=${page}&pageSize=${pageSize}${storeID ? `&storeID=${storeID}` : ""}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Error al conectar con la API");

        const data = await res.json();
        spinner.classList.add("hidden");

        setStatus("");
        return data;
    } catch (err) {
        console.error(err);
        spinner.classList.add("hidden");
        setStatus("Error al cargar datos.");
        errorMsg.classList.remove("hidden");
        return [];
    }
}


function renderGames(games, reset = false) {
    if (reset) grid.innerHTML = "";

    games.forEach(game => {
        const card = document.createElement("div");
        
        
        card.className = "bg-gray-700 rounded-xl shadow-2xl overflow-hidden transform hover:scale-[1.02] transition duration-300";
        
        card.innerHTML = `<img src="${game.thumb}" class="w-full h-40 object-cover" />
            <div class="p-4">
            
            <h3 class="text-md font-bold text-white truncate">${game.title}</h3>

            <div class="flex justify-between items-center mt-2 mb-3">
                <div class="flex flex-col text-left">
                    <span class="text-xs text-gray-400">Precio:</span>
                    <span class="text-sm line-through text-red-400">$${game.normalPrice}</span>
                </div>
                
                <div class="flex flex-col text-right">
                    <span class="text-xs text-gray-400">Oferta:</span>
                    <span class="text-xl font-extrabold text-green-400">$${game.salePrice}</span>
                </div>
            </div>

            <button onclick="openModal('${game.dealID}')"
                class="bg-blue-600 text-white w-full py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition duration-200">
                Ver detalle
            </button>
        </div>
        `;

        grid.appendChild(card);
    });
}


async function openModal(id) {
    modal.classList.remove("hidden");
    modalContent.innerHTML = "<p class='text-center text-lg text-gray-400'>Cargando detalles...</p>";

    try {
        const res = await fetch(`https://www.cheapshark.com/api/1.0/deals?id=${id}`);
        const data = await res.json();

        
        modalContent.innerHTML = `
            <h2 class="text-3xl font-extrabold mb-4 text-blue-400">${data.gameInfo.name}</h2>

            <img src="${data.gameInfo.thumb}" class="w-full h-48 object-cover rounded-lg shadow-md mb-4">

            <div class="space-y-2 text-gray-300">
                <p class="text-lg"><strong>Metacritic:</strong> <span class="font-bold text-yellow-400">${data.gameInfo.metacriticScore}</span></p>
                <p class="text-md">Precio normal: <span class="line-through text-red-400">$${data.gameInfo.retailPrice}</span></p>
                <p class="text-xl font-bold">Precio oferta: <span class="text-green-400">$${data.gameInfo.salePrice}</span></p>
            </div>

            <a href="${data.gameInfo.storeLink}" target="_blank" 
               class="block mt-6 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg text-center font-bold transition duration-200">
                Ver en la Tienda Oficial
            </a>

            <button class="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg closeModal font-semibold transition duration-200">
                Cerrar Ventana
            </button>
        `;
    } catch (error) {
        modalContent.innerHTML = `<p class='text-center text-lg text-red-400'>Error al cargar los detalles.</p>
            <button class="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg closeModal font-semibold transition duration-200">
                Cerrar Ventana
            </button>
        `;
    }
}


modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("closeModal") || e.target === modal) {
        modal.classList.add("hidden");
    }
});


function sortGames(games, criteria) {
    if (criteria === "price") {
        return games.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice));
    }
    if (criteria === "normalPrice") {
        return games.sort((a, b) => parseFloat(a.normalPrice) - parseFloat(b.normalPrice));
    }
    return games;
}

 searchBtn.addEventListener("click", async () => {
    spinner.classList.remove("hidden");
    noResults.classList.add("hidden"); 


    const text = searchInput.value.trim();

    if (text.length === 0) return;

    setStatus("Buscando...");
    isSearching = true;

    try {
        const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${text}&limit=20`);
        const data = await res.json();

    setStatus("");

    
    const games = data.map(g => ({
        title: g.external,
        thumb: g.thumb,
        salePrice: "—",
        normalPrice: "—",
        dealID: g.cheapestDealID
    }));
    if (games.length === 0) {
    renderGames([], true);
    noResults.classList.remove("hidden");
    return;
}

    renderGames(games, true);
}finally{
    spinner.classList.add("hidden");
}
});


storeFilter.addEventListener("change", async () => {
    spinner.classList.remove("hidden");

    currentStore = storeFilter.value;
    page = 0;
    const games = await fetchDeals(0, currentStore);
    renderGames(games, true);
    spinner.classList.add("hidden");

});


sortBy.addEventListener("change", async () => {
    spinner.classList.remove("hidden");

    currentSort = sortBy.value;
    const games = await fetchDeals(0, currentStore);
    renderGames(sortGames(games, currentSort), true);
    spinner.classList.add("hidden");

});


loadMoreBtn.addEventListener("click", async () => {
    spinner.classList.remove("hidden");

    page++;
    const games = await fetchDeals(page, currentStore);
    renderGames(games);
    spinner.classList.add("hidden");

});


document.addEventListener("click", (e) => {
    if (e.target.classList.contains("viewDetail")) {
        const id = e.target.dataset.id;
        openModal(id);
    }
});
 (async () => {
    const games = await fetchDeals();
    renderGames(games);
})();
