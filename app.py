# from flask import Flask, render_template, jsonify
# import pandas as pd

# app = Flask(__name__)

# @app.route('/')
# def index():
#     return render_template('index.html')

# @app.route('/api/dados')
# def dados():
#     df = pd.read_csv('dados/dados.csv', usecols=[
#         'MUNICIPIO', 'REGIAO_GEOGRAFICA', 'SEXO',
#         'NATUREZA JURIDICA', 'DATA', 'IDADE'
#     ])
#     df = df.dropna()
#     dados_json = df.to_dict(orient='records')
#     return jsonify(dados_json)

# if __name__ == '__main__':
#     app.run()

from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://violencia_urbana_db_user:ybrxBIVktHXCZ5pnY9KdKIA6C4metmtF@dpg-d0lmqcffte5s739m92v0-a.oregon-postgres.render.com/violencia_urbana_db'

db = SQLAlchemy(app)

class Dado(db.Model):
    id=db.Column(db.Integer, primary_key=True)
    MUNICIPIO = db.Column(db.String(100))
    REGIAO_GEOGRAFICA = db.Column(db.String(100))
    SEXO = db.Column(db.String(20))
    NATUREZA_JURIDICA = db.Column('NATUREZA JURIDICA', db.String(100))
    DATA = db.Column(db.String(20))
    IDADE = db.Column(db.Integer)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/dados')
def dados():
    dados_query = Dado.query.all()
    dados_json = [
        {
            'MUNICIPIO': dado.MUNICIPIO,
            'REGIAO_GEOGRAFICA': dado.REGIAO_GEOGRAFICA,
            'SEXO': dado.SEXO,
            'NATUREZA JURIDICA': dado.NATUREZA_JURIDICA,
            'DATA': dado.DATA,
            'IDADE': dado.IDADE
        }
        for dado in dados_query
    ]
    return jsonify(dados_json)


if __name__ == '__main__':
    app.run(debug=True)





# postgresql://violencia_urbana_db_user:ybrxBIVktHXCZ5pnY9KdKIA6C4metmtF@dpg-d0lmqcffte5s739m92v0-a/violencia_urbana_db