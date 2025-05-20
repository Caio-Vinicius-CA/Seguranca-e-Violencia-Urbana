from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy

import os

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')

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