// ---------- VARIÁVEIS GLOBAIS ---------- //
// Variáveis que armazenar os dados
let dadosGlobais = [];  // Armazena todos os dados carregados
let grafico = null;     // Primeiro gráfico
let graficoAno = null;  // Segundo gráfico

// ---------- CARREGAMENTO DOS DADOS ---------- //
// Função que carrega os dados da API e inicializa os gráficos
async function carregarDados() {
    showChartLoading();
    showYearChartLoading();

    try {
        // Requisição à API
        const resposta = await fetch('/api/dados/grafico');
        const result = await resposta.json();
        const dadosArray = result.data ? result.data : result;

        if (!Array.isArray(dadosArray)) {
            throw new Error("Expected array but got: " + typeof dadosArray);
        }

        dadosGlobais = dadosArray;
        if (document.getElementById('regiao')) {
            preencherSelects(dadosGlobais);
        }

        if (document.getElementById('grafico')) {
            atualizarGrafico(dadosGlobais);
        }

        if (document.getElementById('grafico-ano')) {
            atualizarGraficoAno(dadosGlobais);
        }

        if (document.getElementById('data-inicial')) {
            configurarIntervaloDatas(dadosGlobais);
        }
    } catch (error) {
        console.error("Error loading data:", error);
        alert("Erro ao carregar dados. Por favor, recarregue a página.");
    } finally {
        hideChartLoading();
        hideYearChartLoading();
    }
}

// ---------- LOADINGS ---------- //
// Funções para mostrar e esconder os loaders dos gráficos
function showChartLoading() {
    const loader = document.getElementById('chart-loading');
    if (loader) loader.classList.add('active');
}

function hideChartLoading() {
    const loader = document.getElementById('chart-loading');
    if (loader) {
        loader.addEventListener('transitionend', () => {
            loader.classList.remove('active');
        }, { once: true });
        loader.style.opacity = '0';
    }
}

function showYearChartLoading() {
    const loader = document.getElementById('year-chart-loading');
    if (loader) loader.classList.add('active');
}

function hideYearChartLoading() {
    const loader = document.getElementById('year-chart-loading');
    if (loader) {
        loader.addEventListener('transitionend', () => {
            loader.classList.remove('active');
        }, { once: true });
        loader.style.opacity = '0';
    }
}

// ---------- PREENCHER SELECTS ---------- //
// Função que preenche os selects
function preencherSelects(dados) {
    const regioes = [...new Set(dados.map(d => d.REGIAO_GEOGRAFICA))];
    const sexos = [...new Set(dados.map(d => d.SEXO))];
    const naturezas = [...new Set(dados.map(d => d["NATUREZA JURIDICA"]))];

    // Preenche os select dos dois gráficos
    fillSelect('regiao', regioes);
    fillSelect('regiao2', regioes);
    fillSelect('sexo', sexos);
    fillSelect('sexo2', sexos);
    fillSelect('natureza', naturezas);
    fillSelect('natureza2', naturezas);
}

// Função auxiliar para preencher um select
function fillSelect(id, options) {
    const select = document.getElementById(id);
    if (!select) return;

    const currentValue = select.value;

    while (select.options.length > 1) {
        select.remove(1);
    }

    options.forEach(option => {
        if (option) {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        }
    });

    if (options.includes(currentValue)) {
        select.value = currentValue;
    }
}

// ---------- FUNÇÕES DOS FILTROS ---------- //
// Função para filtrar os dados com base nos selects
function filtrarDados() {
    const filters = {
        chart1: getFilters('regiao', 'sexo', 'natureza', 'idade'),
        chart2: getFilters('regiao2', 'sexo2', 'natureza2', 'idade2')
    };

    const filtrados1 = aplicarFiltros(dadosGlobais, filters.chart1);
    const filtrados2 = aplicarFiltros(dadosGlobais, filters.chart2);

    atualizarGrafico(filtrados1);
    atualizarGraficoAno(filtrados2);
}

function getFilters(regiaoId, sexoId, naturezaId, idadeId) {
    return {
        regiao: document.getElementById(regiaoId).value,
        sexo: document.getElementById(sexoId).value,
        natureza: document.getElementById(naturezaId).value,
        idade: document.getElementById(idadeId).value
    };
}

function aplicarFiltros(dados, { regiao, sexo, natureza, idade }) {
    let filtrados = [...dados]; // Clona os dados

    if (regiao) filtrados = filtrados.filter(d => d.REGIAO_GEOGRAFICA === regiao);
    if (sexo) filtrados = filtrados.filter(d => d.SEXO === sexo);
    if (natureza) filtrados = filtrados.filter(d => d["NATUREZA JURIDICA"] === natureza);

    if (idade) {
        const [min, max] = idade.split('-').map(Number);
        filtrados = filtrados.filter(d => {
            const idadeNum = parseInt(d.IDADE);
            return !isNaN(idadeNum) && idadeNum >= min && idadeNum <= max;
        });
    }

    return filtrados;
}

// ---------- FUNÇÕES DOS GRÁFICOS ---------- //
// Funções que atualizam os gráficos com os dados filtrados
function atualizarGrafico(dados) {
    const contagem = {};
    dados.forEach(d => {
        const regiao = d.REGIAO_GEOGRAFICA;
        contagem[regiao] = (contagem[regiao] || 0) + 1;
    });

    const ctx = document.getElementById('grafico').getContext('2d');
    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(contagem),
            datasets: [{
                label: 'Casos por Região',
                data: Object.values(contagem),
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
    const casosPorAno = {};

    dados.forEach(dado => {
        if (!dado.DATA) return;
        const ano = dado.DATA.split('/')[2];
        casosPorAno[ano] = (casosPorAno[ano] || 0) + 1;
    });

    const anos = Object.keys(casosPorAno).sort();
    const contagens = anos.map(ano => casosPorAno[ano]);

    const ctx = document.getElementById('grafico-ano').getContext('2d');
    if (graficoAno) graficoAno.destroy();

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

// ---------- FUNÇÕES DAS DATAS ---------- //
// Função que converte data no formato brasileiro
function parseDataBR(data) {
    if (!data) return new Date();
    const [dia, mes, ano] = data.split('/');
    return new Date(`${ano}-${mes}-${dia}`);
}

function configurarIntervaloDatas(dados) {
    if (!dados.length) return;

    const datasConvertidas = dados.map(d => parseDataBR(d.DATA));
    const minData = new Date(Math.min(...datasConvertidas));
    const maxData = new Date(Math.max(...datasConvertidas));

    const minStr = minData.toISOString().split("T")[0];
    const maxStr = maxData.toISOString().split("T")[0];

    const dataInicialEl = document.getElementById("data-inicial");
    const dataFinalEl = document.getElementById("data-final");

    if (dataInicialEl) dataInicialEl.min = minStr;
    if (dataInicialEl) dataInicialEl.max = maxStr;
    if (dataFinalEl) dataFinalEl.min = minStr;
    if (dataFinalEl) dataFinalEl.max = maxStr;
}

// ---------- INICIALIZAÇÃO ---------- //
// Carregar os dados e configura os filtros
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();

    document.querySelectorAll('.filtro, .chart-filter').forEach(filter => {
        filter.addEventListener('change', filtrarDados);
    });
});
