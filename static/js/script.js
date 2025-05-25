// ---------- GLOBAL VARIABLES ---------- //
let dadosGlobais = [];  // Armazena todos os dados carregados
let grafico = null;     // Instância principal do gráfico (por região)
let graficoAno = null;  // Instância do gráfico de casos por ano

// ---------- DATA LOADING ---------- //
async function carregarDados() {
    showChartLoading();            // Mostra indicador de carregamento do gráfico principal
    showYearChartLoading();        // Mostra indicador de carregamento do gráfico por ano

    try {
        const resposta = await fetch('/api/dados/grafico'); // Faz requisição à API
        const result = await resposta.json();               // Converte resposta em JSON

        // Lida com resposta paginada ou não
        const dadosArray = result.data ? result.data : result;

        if (!Array.isArray(dadosArray)) {
            throw new Error("Expected array but got: " + typeof dadosArray); // Verifica se é um array
        }

        dadosGlobais = dadosArray;  // Armazena dados globalmente

        // Inicializa gráficos e filtros conforme a presença dos elementos
        if (document.getElementById('regiao')) {
            preencherSelects(dadosGlobais); // Preenche os filtros de seleção
        }

        if (document.getElementById('grafico')) {
            atualizarGrafico(dadosGlobais); // Cria gráfico principal
        }

        if (document.getElementById('grafico-ano')) {
            atualizarGraficoAno(dadosGlobais); // Cria gráfico por ano
        }

        if (document.getElementById('data-inicial')) {
            configurarIntervaloDatas(dadosGlobais); // Define intervalo de datas nos inputs
        }
    } catch (error) {
        console.error("Error loading data:", error); // Exibe erro no console
        alert("Erro ao carregar dados. Por favor, recarregue a página."); // Alerta usuário
    } finally {
        hideChartLoading();     // Esconde indicador de carregamento do gráfico principal
        hideYearChartLoading(); // Esconde indicador de carregamento do gráfico por ano
    }
}

// ---------- LOADING STATES ---------- //
function showChartLoading() {
    const loader = document.getElementById('chart-loading'); // Elemento do loader
    if (loader) loader.classList.add('active'); // Ativa classe de carregamento
}

function hideChartLoading() {
    const loader = document.getElementById('chart-loading');
    if (loader) {
        loader.addEventListener('transitionend', () => {
            loader.classList.remove('active'); // Remove classe após transição
        }, { once: true });
        loader.style.opacity = '0'; // Inicia fade-out
    }
}

function showYearChartLoading() {
    const loader = document.getElementById('year-chart-loading');
    if (loader) loader.classList.add('active'); // Ativa classe de carregamento do gráfico por ano
}

function hideYearChartLoading() {
    const loader = document.getElementById('year-chart-loading');
    if (loader) {
        loader.addEventListener('transitionend', () => {
            loader.classList.remove('active'); // Remove classe após transição
        }, { once: true });
        loader.style.opacity = '0'; // Inicia fade-out
    }
}

// ---------- FILTER FUNCTIONS ---------- //
function preencherSelects(dados) {
    // Extrai valores únicos para cada filtro
    const regioes = [...new Set(dados.map(d => d.REGIAO_GEOGRAFICA))];
    const sexos = [...new Set(dados.map(d => d.SEXO))];
    const naturezas = [...new Set(dados.map(d => d["NATUREZA JURIDICA"]))];

    // Preenche os selects dos dois gráficos
    fillSelect('regiao', regioes);
    fillSelect('regiao2', regioes);
    fillSelect('sexo', sexos);
    fillSelect('sexo2', sexos);
    fillSelect('natureza', naturezas);
    fillSelect('natureza2', naturezas);
}

// Função auxiliar para preencher um select
function fillSelect(id, options) {
    const select = document.getElementById(id); // Referência ao select
    if (!select) return;

    const currentValue = select.value; // Armazena valor atual selecionado

    // Remove todas opções, exceto a primeira
    while (select.options.length > 1) {
        select.remove(1);
    }

    // Adiciona novas opções
    options.forEach(option => {
        if (option) {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        }
    });

    // Restaura valor selecionado se ainda for válido
    if (options.includes(currentValue)) {
        select.value = currentValue;
    }
}

// ---------- FILTER FUNCTIONS ---------- //
function filtrarDados() {
    // Coleta filtros de ambos os conjuntos
    const filters = {
        chart1: getFilters('regiao', 'sexo', 'natureza', 'idade'),
        chart2: getFilters('regiao2', 'sexo2', 'natureza2', 'idade2')
    };

    // Aplica filtros aos dados
    const filtrados1 = aplicarFiltros(dadosGlobais, filters.chart1);
    const filtrados2 = aplicarFiltros(dadosGlobais, filters.chart2);

    // Atualiza gráficos com dados filtrados
    atualizarGrafico(filtrados1);
    atualizarGraficoAno(filtrados2);
}

// Função auxiliar para obter filtros
function getFilters(regiaoId, sexoId, naturezaId, idadeId) {
    return {
        regiao: document.getElementById(regiaoId).value,
        sexo: document.getElementById(sexoId).value,
        natureza: document.getElementById(naturezaId).value,
        idade: document.getElementById(idadeId).value
    };
}

// Função para aplicar os filtros aos dados
function aplicarFiltros(dados, { regiao, sexo, natureza, idade }) {
    let filtrados = [...dados]; // Clona os dados

    // Aplica os filtros um a um
    if (regiao) filtrados = filtrados.filter(d => d.REGIAO_GEOGRAFICA === regiao);
    if (sexo) filtrados = filtrados.filter(d => d.SEXO === sexo);
    if (natureza) filtrados = filtrados.filter(d => d["NATUREZA JURIDICA"] === natureza);

    if (idade) {
        const [min, max] = idade.split('-').map(Number); // Converte faixa etária
        filtrados = filtrados.filter(d => {
            const idadeNum = parseInt(d.IDADE);
            return !isNaN(idadeNum) && idadeNum >= min && idadeNum <= max; // Aplica filtro de idade
        });
    }

    return filtrados;
}

// ---------- CHART FUNCTIONS ---------- //
function atualizarGrafico(dados) {
    // Conta ocorrências por região
    const contagem = {};
    dados.forEach(d => {
        const regiao = d.REGIAO_GEOGRAFICA;
        contagem[regiao] = (contagem[regiao] || 0) + 1;
    });

    const ctx = document.getElementById('grafico').getContext('2d');
    if (grafico) grafico.destroy(); // Destroi gráfico anterior se existir

    grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(contagem), // Rótulos do eixo X
            datasets: [{
                label: 'Casos por Região',
                data: Object.values(contagem), // Valores do eixo Y
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    precision: 0
                }
            }
        }
    });
}

function atualizarGraficoAno(dados) {
    // Agrupa casos por ano
    const casosPorAno = {};

    dados.forEach(dado => {
        if (!dado.DATA) return;
        const ano = dado.DATA.split('/')[2]; // Extrai ano da data DD/MM/AAAA
        casosPorAno[ano] = (casosPorAno[ano] || 0) + 1;
    });

    const anos = Object.keys(casosPorAno).sort(); // Ordena anos
    const contagens = anos.map(ano => casosPorAno[ano]);

    const ctx = document.getElementById('grafico-ano').getContext('2d');
    if (graficoAno) graficoAno.destroy(); // Destroi gráfico anterior se existir

    graficoAno = new Chart(ctx, {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: 'Casos por Ano',
                data: contagens,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Número de Casos' }
                },
                x: {
                    title: { display: true, text: 'Ano' }
                }
            }
        }
    });
}

// ---------- DATE FUNCTIONS ---------- //
function parseDataBR(data) {
    if (!data) return new Date();
    const [dia, mes, ano] = data.split('/'); // Separa DD/MM/AAAA
    return new Date(`${ano}-${mes}-${dia}`); // Retorna objeto Date
}

function configurarIntervaloDatas(dados) {
    if (!dados.length) return;

    const datasConvertidas = dados.map(d => parseDataBR(d.DATA));
    const minData = new Date(Math.min(...datasConvertidas)); // Data mais antiga
    const maxData = new Date(Math.max(...datasConvertidas)); // Data mais recente

    const minStr = minData.toISOString().split("T")[0];
    const maxStr = maxData.toISOString().split("T")[0];

    const dataInicialEl = document.getElementById("data-inicial");
    const dataFinalEl = document.getElementById("data-final");

    if (dataInicialEl) dataInicialEl.min = minStr;
    if (dataInicialEl) dataInicialEl.max = maxStr;
    if (dataFinalEl) dataFinalEl.min = minStr;
    if (dataFinalEl) dataFinalEl.max = maxStr;
}

// ---------- INITIALIZATION ---------- //
document.addEventListener('DOMContentLoaded', () => {
    carregarDados(); // Carrega os dados ao iniciar

    // Adiciona evento aos filtros
    document.querySelectorAll('.filtro, .chart-filter').forEach(filter => {
        filter.addEventListener('change', filtrarDados); // Atualiza gráficos ao mudar filtro
    });
});
