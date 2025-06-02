# Imports necessárias do Flask, SQLAlchemy e outras bibliotecas
from flask import Flask, render_template, jsonify, request # Para renderizar templates e manipular requisições
from flask_sqlalchemy import SQLAlchemy # Para interagir com o banco de dados
from sqlalchemy import func, and_  # Para funções SQL e múltiplas condições
from datetime import datetime  # Para manipular datas
import os  # Para acessar variáveis de ambiente

# Inicializa a aplicação Flask
app = Flask(__name__)

# Configura a URI do banco de dados, buscando da variável de ambiente DATABASE_URL
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')

# Desativa o rastreamento de modificações para economizar recursos
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa a extensão SQLAlchemy com a aplicação
db = SQLAlchemy(app)

# Define o modelo da tabela 'dado'
class Dado(db.Model):
    __tablename__ = 'dado'  # Define o nome explícito da tabela no banco
    id = db.Column(db.Integer, primary_key=True)  # Coluna de ID como chave primária
    MUNICIPIO = db.Column(db.String(100), index=True)  # Nome do município, indexado
    REGIAO_GEOGRAFICA = db.Column(db.String(100), index=True)  # Região geográfica, indexado
    SEXO = db.Column(db.String(20), index=True)  # Sexo, indexado
    NATUREZA_JURIDICA = db.Column('NATUREZA JURIDICA', db.String(100), index=True)  # Natureza jurídica, indexado
    DATA = db.Column(db.String(20), index=True)  # Data no formato string, indexada
    IDADE = db.Column(db.Integer)  # Idade como inteiro

    # Método auxiliar para converter uma instância em dicionário (usado para JSON)
    def to_dict(self):
        return {
            'MUNICIPIO': self.MUNICIPIO,
            'REGIAO_GEOGRAFICA': self.REGIAO_GEOGRAFICA,
            'SEXO': self.SEXO,
            'NATUREZA JURIDICA': self.NATUREZA_JURIDICA,
            'DATA': self.DATA,
            'IDADE': self.IDADE
        }

# Rota principal que renderiza o template index.html
@app.route('/')
def index():
    return render_template('index.html')

# Rota para uma página separada com uma tabela
@app.route('/tabela')
def tabela():
    return render_template('tabela.html')

# Rota da API que retorna dados com suporte a filtros e paginação
@app.route('/api/dados')
def dados():
    # Parâmetros de paginação: página atual e número de itens por página
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 300, type=int)
    
    # Parâmetros de filtro
    regiao = request.args.get('regiao')
    sexo = request.args.get('sexo')
    natureza = request.args.get('natureza')
    data_inicial = request.args.get('data_inicial')
    data_final = request.args.get('data_final')
    idade_min = request.args.get('idade_min', type=int)
    idade_max = request.args.get('idade_max', type=int)

    # Começa a construir a query base
    query = Dado.query

    # Aplica os filtros se forem fornecidos
    if regiao:
        query = query.filter(Dado.REGIAO_GEOGRAFICA == regiao)
    if sexo:
        query = query.filter(Dado.SEXO == sexo)
    if natureza:
        query = query.filter(Dado.NATUREZA_JURIDICA == natureza)

    # Filtro de intervalo de datas (DATA no formato string DD/MM/YYYY)
    if data_inicial and data_final:
        try:
            # Converte as datas fornecidas (formato ISO) para datetime
            di = datetime.strptime(data_inicial, '%Y-%m-%d')
            df = datetime.strptime(data_final, '%Y-%m-%d')
            
            # Aplica o filtro convertendo as datas da coluna do banco de string para data
            query = query.filter(
                and_(
                    func.to_date(Dado.DATA, 'DD/MM/YYYY') >= di,
                    func.to_date(Dado.DATA, 'DD/MM/YYYY') <= df
                )
            )
        except ValueError:
            pass  # Ignora erro caso a data seja inválida

    # Filtro de faixa etária
    if idade_min is not None and idade_max is not None:
        query = query.filter(Dado.IDADE.between(idade_min, idade_max))

    # Executa a query com paginação
    paginated_data = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Retorna os dados em formato JSON
    return jsonify({
        'data': [dado.to_dict() for dado in paginated_data.items],
        'total': paginated_data.total,
        'pages': paginated_data.pages,
        'current_page': page
    })

# Rota da API que retorna todos os dados (para gráficos, por exemplo)
@app.route('/api/dados/grafico')
def dados_grafico():
    # Consulta todos os dados da tabela
    dados_query = Dado.query.all()

    # Retorna os dados como lista de dicionários em JSON
    return jsonify([dado.to_dict() for dado in dados_query])

# Executa a aplicação Flask em modo debug
if __name__ == '__main__':
    app.run(debug=True)