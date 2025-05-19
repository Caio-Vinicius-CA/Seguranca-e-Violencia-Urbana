from flask import Flask, render_template, jsonify
import pandas as pd

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/dados')
def dados():
    df = pd.read_csv('dados/dados.csv', usecols=[
        'MUNICIPIO', 'REGIAO_GEOGRAFICA', 'SEXO',
        'NATUREZA JURIDICA', 'DATA', 'IDADE'
    ])
    df = df.dropna()
    dados_json = df.to_dict(orient='records')
    return jsonify(dados_json)

if __name__ == '__main__':
    app.run()

