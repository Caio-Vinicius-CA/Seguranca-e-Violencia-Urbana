# Imports necessárias do Flask, SQLAlchemy e outras bibliotecas
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, and_
from datetime import datetime
import os

# Inicializa a aplicação Flask
app = Flask(__name__)

# Configura a URI do DB com DATABASE_URL
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
# Define o modelo da tabela 'dado'
class Dado(db.Model):
    __tablename__ = 'dado'
    id = db.Column(db.Integer, primary_key=True)
    MUNICIPIO = db.Column(db.String(100), index=True)
    REGIAO_GEOGRAFICA = db.Column(db.String(100), index=True)
    SEXO = db.Column(db.String(20), index=True)
    NATUREZA_JURIDICA = db.Column('NATUREZA JURIDICA', db.String(100), index=True)
    DATA = db.Column(db.String(20), index=True)
    IDADE = db.Column(db.Integer)

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

# Rota principal index.html
@app.route('/')
def index():
    return render_template('index.html')

# Rota para a tabela tabela.html
@app.route('/tabela')
def tabela():
    return render_template('tabela.html')

# Rota da API que retornar os dados
@app.route('/api/dados')
def dados():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 1000, type=int)
    
    regiao = request.args.get('regiao')
    sexo = request.args.get('sexo')
    natureza = request.args.get('natureza')
    data_inicial = request.args.get('data_inicial')
    data_final = request.args.get('data_final')
    idade_min = request.args.get('idade_min', type=int)
    idade_max = request.args.get('idade_max', type=int)

    query = Dado.query

    # Filtros
    if regiao:
        query = query.filter(Dado.REGIAO_GEOGRAFICA == regiao)
    if sexo:
        query = query.filter(Dado.SEXO == sexo)
    if natureza:
        query = query.filter(Dado.NATUREZA_JURIDICA == natureza)

    if data_inicial and data_final:
        try:
            di = datetime.strptime(data_inicial, '%Y-%m-%d')
            df = datetime.strptime(data_final, '%Y-%m-%d')
            
            query = query.filter(
                and_(
                    func.to_date(Dado.DATA, 'DD/MM/YYYY') >= di,
                    func.to_date(Dado.DATA, 'DD/MM/YYYY') <= df
                )
            )
        except ValueError:
            pass

    if idade_min is not None and idade_max is not None:
        query = query.filter(Dado.IDADE.between(idade_min, idade_max))

    paginated_data = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'data': [dado.to_dict() for dado in paginated_data.items],
        'total': paginated_data.total,
        'pages': paginated_data.pages,
        'current_page': page
    })

# Rota da API que retorna dados para os gráficos
@app.route('/api/dados/grafico')
def dados_grafico():
    dados_query = Dado.query.all()

    # Retorna em JSON
    return jsonify([dado.to_dict() for dado in dados_query])

if __name__ == '__main__':
    app.run(debug=True)