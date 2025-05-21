from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, and_
from datetime import datetime
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Dado(db.Model):
    __tablename__ = 'dado'  # Explicit table name
    id = db.Column(db.Integer, primary_key=True)
    MUNICIPIO = db.Column(db.String(100), index=True)  # Added index
    REGIAO_GEOGRAFICA = db.Column(db.String(100), index=True)  # Added index
    SEXO = db.Column(db.String(20), index=True)  # Added index
    NATUREZA_JURIDICA = db.Column('NATUREZA JURIDICA', db.String(100), index=True)  # Added index
    DATA = db.Column(db.String(20), index=True)  # Added index
    IDADE = db.Column(db.Integer)

    # Helper method to convert to dict
    def to_dict(self):
        return {
            'MUNICIPIO': self.MUNICIPIO,
            'REGIAO_GEOGRAFICA': self.REGIAO_GEOGRAFICA,
            'SEXO': self.SEXO,
            'NATUREZA JURIDICA': self.NATUREZA_JURIDICA,
            'DATA': self.DATA,
            'IDADE': self.IDADE
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tabela')
def tabela():
    return render_template('tabela.html')

@app.route('/api/dados')
def dados():
    # Pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 120, type=int)
    
    # Filter parameters
    regiao = request.args.get('regiao')
    sexo = request.args.get('sexo')
    natureza = request.args.get('natureza')
    data_inicial = request.args.get('data_inicial')
    data_final = request.args.get('data_final')
    idade_min = request.args.get('idade_min', type=int)
    idade_max = request.args.get('idade_max', type=int)
    
    # Start building the query
    query = Dado.query
    
    # Apply filters if they exist
    if regiao:
        query = query.filter(Dado.REGIAO_GEOGRAFICA == regiao)
    if sexo:
        query = query.filter(Dado.SEXO == sexo)
    if natureza:
        query = query.filter(Dado.NATUREZA_JURIDICA == natureza)
    
    # Date filtering (assuming DATA is in DD/MM/YYYY format)
    if data_inicial and data_final:
        try:
            # Convert filter dates to datetime objects
            di = datetime.strptime(data_inicial, '%Y-%m-%d')
            df = datetime.strptime(data_final, '%Y-%m-%d')
            
            # Filter by date range (this requires parsing the string dates in the database)
            query = query.filter(
                and_(
                    func.to_date(Dado.DATA, 'DD/MM/YYYY') >= di,
                    func.to_date(Dado.DATA, 'DD/MM/YYYY') <= df
                )
            )
        except ValueError:
            pass  # Handle invalid dates
    
    # Age range filtering
    if idade_min is not None and idade_max is not None:
        query = query.filter(Dado.IDADE.between(idade_min, idade_max))
    
    # Execute paginated query
    paginated_data = query.paginate(page=page, per_page=per_page, error_out=False)
    print(paginated_data.total)
    print(paginated_data.pages)
    print(paginated_data.page)

    
    return jsonify({
        'data': [dado.to_dict() for dado in paginated_data.items],
        'total': paginated_data.total,
        'pages': paginated_data.pages,
        'current_page': page
    })

@app.route('/api/dados/grafico')
def dados_grafico():
    # You might want to add similar filtering capabilities here
    dados_query = Dado.query.all()
    return jsonify([dado.to_dict() for dado in dados_query])

if __name__ == '__main__':
    app.run(debug=True)