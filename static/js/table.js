// ---------- VARIÁVEIS GLOBAIS ---------- //
// Variáveis que armazenar os dados
let dadosGlobais = [];  // Armazena todos os dados carregados
let currentPage = 1;    // Página atual para paginação
const perPage = 7000;    // Itens por página para paginação

// ---------- CARREGAMENTO DOS DADOS ---------- //
// Função que carrega os dados da API e atualiza a tabela
async function carregarDados(page = 1) {
    try {
        showTableLoading();

        // Requisição para a API
        const resposta = await fetch(`/api/dados?page=${page}&per_page=${perPage}`);
        if (!resposta.ok) throw new Error('Network response was not ok');
        const dados = await resposta.json();
        console.log('API Response:', dados);
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
        console.error("Error loading data:", error);
        document.getElementById('pagination').innerHTML =
            '<span style="color: red;">Erro ao carregar dados. Recarregue a página.</span>';
    } finally {
        hideTableLoading();
    }
}

// ---------- LOADINGS ---------- //
// Funções para mostrar e esconder os loadings
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

// ---------- TRATAMENTO DE DADOS ---------- //
// Dados e manipulação de datas
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

// ---------- TABELA E PAGINAÇÃO ---------- //
// Função que atualiza a tabela
function atualizarTabela(dados) {
    const tbody = document.querySelector('#tabela tbody');
    tbody.innerHTML = '';

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

function updatePagination(totalItems, totalPages, currentPage) {
    console.log('Updating pagination:', { totalItems, totalPages, currentPage });
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) {
        console.error("Pagination div not found!");
        return;
    }

    paginationDiv.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '« Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => carregarDados(currentPage - 1));
    paginationDiv.appendChild(prevBtn);

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

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Próxima »';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.addEventListener('click', () => carregarDados(currentPage + 1));
    paginationDiv.appendChild(nextBtn);

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

// ---------- FILTRAGEM ---------- //
// Função que filtra a tabela
function filtrarTabela() {
    showTableLoading();

    const filtros = document.querySelectorAll(".filtro");
    const linhas = document.querySelectorAll("#tabela tbody tr");

    const dataInicial = document.getElementById("data-inicial").value;
    const dataFinal = document.getElementById("data-final").value;

    linhas.forEach(linha => {
        let mostrar = true;

        filtros.forEach(filtro => {
            const col = parseInt(filtro.dataset.col);
            const tipo = filtro.dataset.tipo || "texto";
            const valorFiltro = filtro.value.toLowerCase();
            const celulaTexto = linha.children[col].textContent.toLowerCase();

            if (valorFiltro) {
                if (tipo === "faixa-etaria") {
                    const idade = parseInt(celulaTexto);
                    const [min, max] = valorFiltro.split("-").map(Number);
                    if (isNaN(idade) || idade < min || idade > max) {
                        mostrar = false;
                    }
                } else {
                    if (!celulaTexto.includes(valorFiltro)) {
                        mostrar = false;
                    }
                }
            }
        });

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

        linha.style.display = mostrar ? "" : "none";
        setTimeout(hideTableLoading, 0);
    });
}
