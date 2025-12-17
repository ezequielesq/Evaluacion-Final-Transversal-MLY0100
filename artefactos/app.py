from fastapi import FastAPI, HTTPException
import joblib
import numpy as np

app = FastAPI()

# cargar UNA vez
model = joblib.load("modelo_riesgo_crediticio_lgb.pkl")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(features: list):
    if len(features) != model.n_features_:
        raise HTTPException(
            status_code=400,
            detail=f"Se esperaban {model.n_features_} features"
        )

    X = np.array(features).reshape(1, -1)
    pred = int(model.predict(X)[0])
    prob = float(model.predict_proba(X)[0][1])

    return {
        "prediccion": pred,
        "probabilidad": prob
    }
