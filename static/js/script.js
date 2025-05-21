// ---------- GLOBAL VARIABLES ---------- //
let dadosGlobais = [];  // Stores all loaded data
let grafico = null;     // Main chart instance (by region)
let graficoAno = null;  // Yearly chart instance

// ---------- DATA LOADING ---------- //
async function carregarDados() {
    showChartLoading(); 
    showYearChartLoading();

    try {
        const resposta = await fetch('/api/dados/grafico');
        const result = await resposta.json();
        
        // Handle both paginated and non-paginated responses
        const dadosArray = result.data ? result.data : result;
        
        if (!Array.isArray(dadosArray)) {
            throw new Error("Expected array but got: " + typeof dadosArray);
        }
        
        dadosGlobais = dadosArray;
        
        // Initialize both charts and filters
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

// ---------- LOADING STATES ---------- //
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

// ---------- FILTER FUNCTIONS ---------- //
function preencherSelects(dados) {
    const selectRegiao = document.getElementById('regiao');
    const selectSexo = document.getElementById('sexo');
    const selectNatureza = document.getElementById('natureza');

    // Clear existing options
    selectRegiao.innerHTML = '<option value="">Todas</option>';
    selectSexo.innerHTML = '<option value="">Todos</option>';
    selectNatureza.innerHTML = '<option value="">Todas</option>';

    // Get unique values
    const regioes = [...new Set(dados.map(d => d.REGIAO_GEOGRAFICA))];
    const sexos = [...new Set(dados.map(d => d.SEXO))];
    const naturezas = [...new Set(dados.map(d => d["NATUREZA JURIDICA"]))];

    // Populate dropdowns
    regioes.forEach(regiao => {
        const option = new Option(regiao, regiao);
        selectRegiao.add(option);
    });

    sexos.forEach(sexo => {
        const option = new Option(sexo, sexo);
        selectSexo.add(option);
    });

    naturezas.forEach(natureza => {
        const option = new Option(natureza, natureza);
        selectNatureza.add(option);
    });
}

function filtrarDados() {
    const regiao = document.getElementById('regiao').value;
    const sexo = document.getElementById('sexo').value;
    const natureza = document.getElementById('natureza').value;
    
    let filtrados = [...dadosGlobais];
    
    if (regiao) filtrados = filtrados.filter(d => d.REGIAO_GEOGRAFICA === regiao);
    if (sexo) filtrados = filtrados.filter(d => d.SEXO === sexo);
    if (natureza) filtrados = filtrados.filter(d => d["NATUREZA JURIDICA"] === natureza);
    
    // Update both charts
    atualizarGrafico(filtrados);
    atualizarGraficoAno(filtrados);
}

// ---------- CHART FUNCTIONS ---------- //
function atualizarGrafico(dados) {
    // Count cases by region
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
    // Group data by year
    const casosPorAno = {};
    
    dados.forEach(dado => {
        if (!dado.DATA) return;
        const ano = dado.DATA.split('/')[2]; // Extract year from DD/MM/YYYY
        casosPorAno[ano] = (casosPorAno[ano] || 0) + 1;
    });
    
    // Sort years chronologically
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

// ---------- DATE FUNCTIONS ---------- //
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

// ---------- INITIALIZATION ---------- //
document.addEventListener('DOMContentLoaded', carregarDados);