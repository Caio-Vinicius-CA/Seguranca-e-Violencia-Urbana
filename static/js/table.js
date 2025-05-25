// ======================
// INICIALIZAÇÃO E VARIÁVEIS GLOBAIS
// ======================

// Armazena os dados carregados do backend
let dadosGlobais = [];

// Página atual da paginação (padrão: 1)
let currentPage = 1;

// Número de itens por página
const perPage = 300;

// ======================
// CARREGAMENTO DE DADOS
// ======================

/**
 * Carrega dados paginados da API e atualiza a tabela
 * @param {number} page - Número da página a ser carregada (padrão: 1)
 */
async function carregarDados(page = 1) {
    try {
        showTableLoading(); // Exibe o indicador de carregamento

        // Requisição para a API com parâmetros de paginação
        const resposta = await fetch(`/api/dados?page=${page}&per_page=${perPage}`);
        if (!resposta.ok) throw new Error('Network response was not ok');

        // Conversão da resposta em JSON
        const dados = await resposta.json();
        console.log('API Response:', dados);

        // Armazena os dados no array global
        dadosGlobais = dados.data ? dados.data : [];
        currentPage = page;

        // Atualiza a tabela com os dados carregados
        atualizarTabela(dadosGlobais);

        // Configura o intervalo de datas, se os campos existirem
        if (document.getElementById("data-inicial")) {
            configurarIntervaloDatas(dadosGlobais);
        }

        // Atualiza os controles de paginação
        updatePagination(dados.total, dados.pages, currentPage);

    } catch (error) {
        // Exibe mensagem de erro em caso de falha
        console.error("Error loading data:", error);
        document.getElementById('pagination').innerHTML =
            '<span style="color: red;">Erro ao carregar dados. Recarregue a página.</span>';
    } finally {
        hideTableLoading(); // Esconde o indicador de carregamento
    }
}

// ======================
// FUNÇÕES DE LOADING
// ======================

/**
 * Exibe o elemento de carregamento da tabela
 */
function showTableLoading() {
    const loadingElement = document.getElementById('table-loading');
    if (loadingElement) {
        loadingElement.classList.add('active');
    }
}

/**
 * Oculta o elemento de carregamento da tabela
 */
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
 * Converte data no formato brasileiro (DD/MM/AAAA) para objeto Date
 * @param {string} data - Data em formato DD/MM/AAAA
 * @returns {Date} Objeto Date correspondente
 */
function parseDataBR(data) {
    if (!data) return new Date();

    try {
        const [dia, mes, ano] = data.split('/');
        return new Date(`${ano}-${mes}-${dia}`);
    } catch (e) {
        console.warn("Failed to parse date:", data);
        return new Date();
    }
}

/**
 * Configura os valores mínimos e máximos para inputs de data
 * @param {Array} dados - Array de objetos com campo DATA
 */
function configurarIntervaloDatas(dados) {
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
        console.warn("No valid data provided to configurarIntervaloDatas");
        return;
    }

    const datasConvertidas = dados.map(d => parseDataBR(d.DATA));
    const minData = new Date(Math.min(...datasConvertidas));
    const maxData = new Date(Math.max(...datasConvertidas));

    const minStr = minData.toISOString().split("T")[0];
    const maxStr = maxData.toISOString().split("T")[0];

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
 * Atualiza a tabela com os dados fornecidos
 * @param {Array} dados - Lista de objetos a serem exibidos na tabela
 */
function atualizarTabela(dados) {
    const tbody = document.querySelector('#tabela tbody');
    tbody.innerHTML = ''; // Limpa a tabela

    // Cria uma linha para cada item de dados
    dados.forEach(d => {
        const linha = document.createElement('tr');
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
 * Atualiza os botões de navegação de páginas
 * @param {number} totalItems - Total de itens no conjunto de dados
 * @param {number} totalPages - Número total de páginas disponíveis
 * @param {number} currentPage - Página atualmente ativa
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

    // Botão "Anterior"
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '« Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => carregarDados(currentPage - 1));
    paginationDiv.appendChild(prevBtn);

    // Botões de página
    const maxVisible = 18;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
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

    // Botão "Próxima"
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Próxima »';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener('click', () => carregarDados(currentPage + 1));
    paginationDiv.appendChild(nextBtn);

    // Adiciona classe para estilo
    paginationDiv.classList.add('pagination-container');
}

// Inicializa os dados assim que o DOM estiver carregado
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

/**
 * Aplica filtros aos dados da tabela com base nos inputs do usuário
 */
function filtrarTabela() {
    showTableLoading();

    const filtros = document.querySelectorAll(".filtro");
    const linhas = document.querySelectorAll("#tabela tbody tr");

    // Obtém as datas do filtro
    const dataInicial = document.getElementById("data-inicial").value;
    const dataFinal = document.getElementById("data-final").value;

    linhas.forEach(linha => {
        let mostrar = true; // Flag de visibilidade da linha

        // Aplica filtros de colunas
        filtros.forEach(filtro => {
            const col = parseInt(filtro.dataset.col);
            const tipo = filtro.dataset.tipo || "texto";
            const valorFiltro = filtro.value.toLowerCase();
            const celulaTexto = linha.children[col].textContent.toLowerCase();

            if (valorFiltro) {
                if (tipo === "faixa-etaria") {
                    // Filtro por faixa etária
                    const idade = parseInt(celulaTexto);
                    const [min, max] = valorFiltro.split("-").map(Number);
                    if (isNaN(idade) || idade < min || idade > max) {
                        mostrar = false;
                    }
                } else {
                    // Filtro textual
                    if (!celulaTexto.includes(valorFiltro)) {
                        mostrar = false;
                    }
                }
            }
        });

        // Aplica filtro por intervalo de datas
        if (dataInicial || dataFinal) {
            const textoData = linha.children[4].textContent;
            const [dia, mes, ano] = textoData.split('/');
            const dataLinha = new Date(`${ano}-${mes}-${dia}`);

            if (dataInicial && dataLinha < new Date(dataInicial)) {
                mostrar = false;
            }
            if (dataFinal && dataLinha > new Date(dataFinal)) {
                mostrar = false;
            }
        }

        // Exibe ou oculta a linha com base nos filtros
        linha.style.display = mostrar ? "" : "none";
        setTimeout(hideTableLoading, 0);
    });
}
