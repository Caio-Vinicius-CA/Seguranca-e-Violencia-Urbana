// ======================
// INICIALIZAÇÃO E VARIÁVEIS GLOBAIS
// ======================

// Armazena os dados carregados do backend (only current page's data)
let dadosGlobais = [];

// Página atual da paginação (defaults to 1)
let currentPage = 1;

// Número de itens por página
const perPage = 120;


// ======================
// CARREGAMENTO DE DADOS
// ======================

/**
 * Loads paginated data from API and updates table
 * @param {number} page - Page number to load (default: 1)
 */
async function carregarDados(page = 1) {
    try {
        showTableLoading(); // Show loading animation
        // 1. Fetch data from API with pagination parameters
        const resposta = await fetch(`/api/dados?page=${page}&per_page=${perPage}`);
        if (!resposta.ok) throw new Error('Network response was not ok');

        // 2. Parse JSON response
        const dados = await resposta.json();


        console.log('API Response:', dados)

        // 3. Handle both paginated and non-paginated responses
        //    (paginated responses use 'data' property, non-paginated is array directly)
        dadosGlobais = dados.data ? dados.data : [];
        currentPage = page;

        // 4. Update table with new data
        atualizarTabela(dadosGlobais);

        // 5. Configure date range filters if they exist on page
        if (document.getElementById("data-inicial")) {
            configurarIntervaloDatas(dadosGlobais);
        }

        // 6. Update pagination controls with new metadata
        updatePagination(dados.total, dados.pages, currentPage);

    } catch (error) {
        console.error("Error loading data:", error);
        // Show user-friendly error message in pagination area
        document.getElementById('pagination').innerHTML =
            '<span style="color: red;">Erro ao carregar dados. Recarregue a página.</span>';
    } finally {
        hideTableLoading()
    }

}

// ======================
// LOADING STATE FUNCTIONS
// ======================

function showTableLoading() {
    const loadingElement = document.getElementById('table-loading');
    if (loadingElement) {
        loadingElement.classList.add('active');
    }
}

function hideTableLoading() {
    const loadingElement = document.getElementById('table-loading');
    if (loadingElement) {
        loadingElement.classList.remove('active');
    }
}



// ======================
// DATE HANDLING SECTION
// ======================

/**
 * Parses Brazilian format date (DD/MM/YYYY) to Date object
 * @param {string} data - Date string in DD/MM/YYYY format
 * @returns {Date} Parsed date or current date if invalid
 */
function parseDataBR(data) {
    if (!data) return new Date(); // Fallback to current date

    try {
        const [dia, mes, ano] = data.split('/');
        return new Date(`${ano}-${mes}-${dia}`);
    } catch (e) {
        console.warn("Failed to parse date:", data);
        return new Date(); // Fallback to current date
    }
}

/**
 * Configures valid date range for date inputs
 * @param {Array} dados - Array of data items containing DATE fields
 */
function configurarIntervaloDatas(dados) {
    // Validate input data
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
        console.warn("No valid data provided to configurarIntervaloDatas");
        return;
    }

    // 1. Convert all dates to Date objects
    const datasConvertidas = dados.map(d => parseDataBR(d.DATA));

    // 2. Find min and max dates
    const minData = new Date(Math.min(...datasConvertidas));
    const maxData = new Date(Math.max(...datasConvertidas));

    // 3. Format as YYYY-MM-DD for input elements
    const minStr = minData.toISOString().split("T")[0];
    const maxStr = maxData.toISOString().split("T")[0];

    // 4. Update date input constraints
    const dataInicialEl = document.getElementById("data-inicial");
    const dataFinalEl = document.getElementById("data-final");

    if (dataInicialEl) {
        dataInicialEl.min = minStr;
        dataInicialEl.max = maxStr;
    }
    if (dataFinalEl) {
        dataFinalEl.min = minStr;
        dataFinalEl.max = maxStr;
    }
}


// ======================
// TABLE & PAGINATION SECTION
// ======================

/**
 * Updates table with new data
 * @param {Array} dados - Array of data items to display
 */
function atualizarTabela(dados) {
    const tbody = document.querySelector('#tabela tbody');
    tbody.innerHTML = ''; // Clear existing rows

    // Create and append new rows for each data item
    dados.forEach(d => {
        const linha = document.createElement('tr');
        // Using template literal for row HTML
        linha.innerHTML = `
<td>${d.MUNICIPIO}</td>
<td>${d.REGIAO_GEOGRAFICA}</td>
<td>${d.SEXO}</td>
<td>${d['NATUREZA JURIDICA']}</td>
<td>${d.DATA}</td>
<td>${d.IDADE}</td>
`;
        tbody.appendChild(linha);
    });
}

/**
 * Updates pagination controls
 * @param {number} totalItems - Total items in dataset
 * @param {number} totalPages - Total pages available
 * @param {number} currentPage - Current active page
 */
function updatePagination(totalItems, totalPages, currentPage) {
    console.log('Updating pagination:', { totalItems, totalPages, currentPage });
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) {
        console.error("Pagination div not found!");
        return;
    }

    // Clear existing buttons
    paginationDiv.innerHTML = '';

    // Don't show pagination if only 1 page
    if (totalPages <= 1) return;

    // Create Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '« Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => carregarDados(currentPage - 1));
    paginationDiv.appendChild(prevBtn);

    // Create page number buttons
    const maxVisible = 18; // Show max 5 page buttons
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    // Adjust if we're at the end
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) {
            btn.classList.add('active');
            btn.style.fontWeight = 'bold';
        }
        btn.addEventListener('click', () => carregarDados(i));
        paginationDiv.appendChild(btn);
    }

    // Create Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Próxima »';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener('click', () => carregarDados(currentPage + 1));
    paginationDiv.appendChild(nextBtn);

    // Add CSS classes (they should be in your style.css)
    paginationDiv.classList.add('pagination-container');
}

// Initialize table when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await carregarDados();
    } catch (error) {
        console.error("Falha ao carregar dados iniciais:", error);
        // Mostrar mensagem amigável ao usuário
    }
});


// ======================
// FILTERING SECTION
// ======================

/**
 * Filters table rows based on user input
 */
function filtrarTabela() {

    showTableLoading()

    // 1. Get all filter inputs and table rows
    const filtros = document.querySelectorAll(".filtro");
    const linhas = document.querySelectorAll("#tabela tbody tr");

    // 2. Get date filter values
    const dataInicial = document.getElementById("data-inicial").value;
    const dataFinal = document.getElementById("data-final").value;

    // 3. Process each row
    linhas.forEach(linha => {
        let mostrar = true; // Flag to determine row visibility

        // 4. Apply column filters
        filtros.forEach(filtro => {
            const col = parseInt(filtro.dataset.col); // Column index to filter
            const tipo = filtro.dataset.tipo || "texto"; // Filter type
            const valorFiltro = filtro.value.toLowerCase();
            const celulaTexto = linha.children[col].textContent.toLowerCase();

            if (valorFiltro) {
                if (tipo === "faixa-etaria") {
                    // Handle age range filtering
                    const idade = parseInt(celulaTexto);
                    const [min, max] = valorFiltro.split("-").map(Number);
                    if (isNaN(idade) || idade < min || idade > max) {
                        mostrar = false;
                    }
                } else {
                    // Handle text filtering
                    if (!celulaTexto.includes(valorFiltro)) {
                        mostrar = false;
                    }
                }
            }
        });

        // 5. Apply date range filtering
        if (dataInicial || dataFinal) {
            const textoData = linha.children[4].textContent; // Get date from 5th column (index 4)
            const [dia, mes, ano] = textoData.split('/');
            const dataLinha = new Date(`${ano}-${mes}-${dia}`);

            // Check if date is outside range
            if (dataInicial && dataLinha < new Date(dataInicial)) {
                mostrar = false;
            }
            if (dataFinal && dataLinha > new Date(dataFinal)) {
                mostrar = false;
            }
        }

        // 6. Update row visibility
        linha.style.display = mostrar ? "" : "none";
        setTimeout(hideTableLoading, 0);
    });
}