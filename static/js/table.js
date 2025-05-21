// ======================
// INICIALIZAÇÃO E VARIÁVEIS GLOBAIS
// ======================

// Armazena os dados carregados do backend
let dadosGlobais = [];

// Página atual da paginação (padrão: 1)
let currentPage = 1;

// Número de ítens por página
const perPage = 300;

// ======================
// CARREGAMENTO DE DADOS
// ======================

/**
 * Loads paginated data from API and updates table
 * @param {number} page - Page number to load (default: 1)
 */
async function carregarDados(page = 1) {
    try {
        showTableLoading(); // Animação de loading
        // 1. Fetch data from API with pagination parameters
        const resposta = await fetch(`/api/dados?page=${page}&per_page=${perPage}`);
        if (!resposta.ok) throw new Error('Network response was not ok');

        // 2. Parse JSON response
        const dados = await resposta.json();

        console.log('API Response:', dados)

        // 3. Lida com os dados paginados e não paginados
        dadosGlobais = dados.data ? dados.data : [];
        currentPage = page;

        // 4. Atualiza tabela com novos dados
        atualizarTabela(dadosGlobais);

        // 5. Configura filtro de data
        if (document.getElementById("data-inicial")) {
            configurarIntervaloDatas(dadosGlobais);
        }

        // 6. Atualiza paginação
        updatePagination(dados.total, dados.pages, currentPage);

    } catch (error) {
        console.error("Error loading data:", error);
        document.getElementById('pagination').innerHTML =
            '<span style="color: red;">Erro ao carregar dados. Recarregue a página.</span>';
    } finally {
        hideTableLoading()
    }
}

// ======================
// FUNÇÕES DE LOADING
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
// TRATAMENTO DE DADOS
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
    // Validar dados de entrada
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
// TABELA E PAGINAÇÃO
// ======================

/**
 * Updates table with new data
 * @param {Array} dados - Array of data items to display
 */
function atualizarTabela(dados) {
    const tbody = document.querySelector('#tabela tbody');
    tbody.innerHTML = ''; 

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

    paginationDiv.innerHTML = '';

    if (totalPages <= 1) return;

    // Create Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '« Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => carregarDados(currentPage - 1));
    paginationDiv.appendChild(prevBtn);

    // Create page number buttons
    const maxVisible = 18;
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
    }
});

// ======================
// FILTRAGEM
// ======================

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
            const col = parseInt(filtro.dataset.col);
            const tipo = filtro.dataset.tipo || "texto";
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
            const textoData = linha.children[4].textContent;
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