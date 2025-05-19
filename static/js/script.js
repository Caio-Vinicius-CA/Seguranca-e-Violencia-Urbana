// ---------- INTEGRAçÃO E CRIAÇÃO ---------- //

let dadosGlobais = [];  // Armazenará os dados carregados do backend.
let grafico = null;  // Armazenará o objeto do gráfico gerado com Chart.js.

async function carregarDados() {
    const resposta = await fetch('/api/dados');
    const dados = await resposta.json();
    dadosGlobais = dados;

    preencherSelects(dados);  // Preenche o select do gráfico
    configurarIntervaloDatas(dados);  // define o intervalo de datas válidas.
    atualizarGrafico(dados);  // Cria o gráfico inicial
    atualizarTabela(dados);  // preenche a tabela inicial
}

// ---------- FIM INTEGRAçÃO E CRIAÇÃO ---------- //


// ---------- GRÁFICO ---------- //

function preencherSelects(dados) {  // Preenche o select do gráfico
    const selectRegiao = document.getElementById('regiao');
    const regioes = [...new Set(dados.map(d => d.REGIAO_GEOGRAFICA))];

    const selectSexo = document.getElementById('sexo');
    const sexos = [...new Set(dados.map(d => d.SEXO))];

    const selectNatureza = document.getElementById('natureza');
    const naturezas = [...new Set(dados.map(d => d["NATUREZA JURIDICA"]))];


    regioes.forEach(regiao => {
        const option = document.createElement('option');
        option.value = regiao;
        option.textContent = regiao;
        selectRegiao.appendChild(option);
    });

    sexos.forEach(sexo => {
        const option = document.createElement('option');
        option.value = sexo;
        option.textContent = sexo;
        selectSexo.appendChild(option);
    });

    naturezas.forEach(natureza => {
        const option = document.createElement('option');
        option.value = natureza;
        option.textContent = natureza;
        selectNatureza.appendChild(option);
    });
}

// ---------- FIM GRÁFICO ---------- //

// ---------- DATAS ---------- //

function parseDataBR(data) {
    const [dia, mes, ano] = data.split('/');
    return new Date(`${ano}-${mes}-${dia}`);
}

function configurarIntervaloDatas(dados) {
    const datasConvertidas = dados.map(d => parseDataBR(d.DATA));

    const minData = new Date(Math.min(...datasConvertidas));
    const maxData = new Date(Math.max(...datasConvertidas));

    const minStr = minData.toISOString().split("T")[0];
    const maxStr = maxData.toISOString().split("T")[0];

    document.getElementById("data-inicial").min = minStr;
    document.getElementById("data-inicial").max = maxStr;
    document.getElementById("data-final").min = minStr;
    document.getElementById("data-final").max = maxStr;
}

// ---------- FIM DATAS ---------- //

// ---------- GRÁFICO ---------- //

function filtrarDados() {  // filtra os dados do gráfico por região
    const regiao = document.getElementById('regiao').value;
    const sexo = document.getElementById('sexo').value;
    const natureza = document.getElementById('natureza').value;
    let filtrados = [...dadosGlobais];

    if (regiao) {
        filtrados = filtrados.filter(d => d.REGIAO_GEOGRAFICA === regiao);
    }
    if (sexo) {
        filtrados = filtrados.filter(d => d.SEXO === sexo);
    }
    if (natureza) {
        filtrados = filtrados.filter(d => d["NATUREZA JURIDICA"] === natureza);
    }

    atualizarGrafico(filtrados);
}

function atualizarGrafico(dados) {  // Cria ou atualiza um gráfico de barras com os dados por região.
    //Conta quantas ocorrências existem por região.
    const contagem = {};
    dados.forEach(d => {
        const regiao = d.REGIAO_GEOGRAFICA;
        contagem[regiao] = (contagem[regiao] || 0) + 1;
    });

    //Extrai os rótulos (regiões) e seus valores (contagens).
    const labels = Object.keys(contagem);
    const valores = Object.values(contagem);

    const ctx = document.getElementById('grafico').getContext('2d');
    if (grafico) grafico.destroy();

    //Cria o gráfico de barras com os dados e opções de visualização.
    grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Casos por Região',
                data: valores,
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
// ---------- FIM GRÁFICO ---------- //

// ---------- TABELA ---------- //

function atualizarTabela(dados) {  // Cria ou atualiza a tabela HTML com os dados.
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

document.addEventListener('DOMContentLoaded', carregarDados);


function filtrarTabela() {  // Função para filtrar tabela
    //Seleciona todos os inputs de filtro e todas as linhas da tabela.
    const filtros = document.querySelectorAll(".filtro");
    const linhas = document.querySelectorAll("#tabela tbody tr");

    //Captura os valores do filtro de data.
    const dataInicial = document.getElementById("data-inicial").value;
    const dataFinal = document.getElementById("data-final").value;

    linhas.forEach(linha => {
        let mostrar = true;

        //Para cada filtro, pega: | A coluna que ele filtra (usando data-col); | O tipo de filtro (texto ou faixa-etária); | O valor do input do filtro; | O texto da célula correspondente da linha.
        filtros.forEach(filtro => {
            const col = parseInt(filtro.dataset.col);
            const tipo = filtro.dataset.tipo || "texto";
            const valorFiltro = filtro.value.toLowerCase();
            const celulaTexto = linha.children[col].textContent.toLowerCase();

            //Aplica o filtro | Verifica se o conteúdo da célula inclui o valor do filtro.
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

        // Filtra por intervalo de datas, convertendo a data da linha para Date e comparando com os valores do input.
        if (dataInicial || dataFinal) {
            const textoData = linha.children[4].textContent; // formato dd/mm/yyyy
            const [dia, mes, ano] = textoData.split('/');
            const dataLinha = new Date(`${ano}-${mes}-${dia}`);

            if (dataInicial && dataLinha < new Date(dataInicial)) {
                mostrar = false;
            }
            if (dataFinal && dataLinha > new Date(dataFinal)) {
                mostrar = false;
            }
        }

        //Exibe a linha se ela passou em todos os filtros, ou esconde se não passou.
        linha.style.display = mostrar ? "" : "none";
    });
}

// ---------- FIM TABELA ---------- //
