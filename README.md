1. Baixe a DB redis.
2. Rode o comando `npm install` para instalar as dependências.
3. Crie o `.env` com base no exemplo abaixo:

```# API ENV
API_KEY="{sua api key}"
STD_CURRENCY="BRL"

# DB
DB_HOST="{host da sua db}"
DB_PORT="{porta da sua db}"
DB_PASSWORD="{senha da sua db}"
DB_INDEX="{índice da sua db}"



# 10 MINUTES for update, start_time = 
UPDATE_INTERVAL=10
START_TIME= '10:30' 
END_TIME= '18:00'

# App env.
PORT=8080
```

Quando estiver pronto, basta fazer uma requisição GET

```
http://{HOST}:{PORT}/api/v1/metalprices/latest
http://{HOST}:{PORT}/api/v1/metalprices/closest_time
http://{HOST}:{PORT}/api/v1/metalprices/all
```
