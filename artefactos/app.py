from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np

app = FastAPI()

# =========================
# CORS (SOLUCIÓN AL ERROR)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",      # Angular dev
        "https://www.ezsuarez.org"    # Producción (si aplica)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# CARGA MODELO
# =========================
model = joblib.load("modelo_riesgo_crediticio_lgb.pkl")

# =========================
# ENDPOINTS
# =========================
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(request: Request):
    body = await request.json()

    # LOG
    print("===== BODY RECIBIDO =====")
    print(body)
    print("TIPO:", type(body))
    print("=========================")

    # Validación manual
    if not isinstance(body, list):
        raise HTTPException(
            status_code=400,
            detail="El body NO es una lista"
        )

    if len(body) != model.n_features_:
        raise HTTPException(
            status_code=400,
            detail=f"Se esperaban {model.n_features_} features"
        )

    X = np.array(body).reshape(1, -1)
    pred = int(model.predict(X)[0])
    prob = float(model.predict_proba(X)[0][1])

    return {
        "prediccion": pred,
        "probabilidad": prob
    }
