# Proyecto de Machine Learning

## Predicción de Riesgo Crediticio (Home Credit)

Este proyecto desarrolla un **flujo completo de Machine Learning supervisado** para la **predicción de incumplimiento de pago** en solicitudes de crédito utilizando el dataset de **Home Credit**.

El trabajo se estructura en **cuatro fases principales**:

1. **Comprensión de los datos**
2. **Preparación de los datos**
3. **Modelamiento**
4. **Evaluación y despliegue**

El objetivo final es construir, evaluar y desplegar un modelo capaz de **estimar la probabilidad de incumplimiento (`TARGET = 1`)**, priorizando métricas relevantes para problemas desbalanceados como **Recall, F1-score y ROC AUC**.

Para ejecutar correctamente el proyecto es necesario crear una carpeta llamada `datos_examen` y ubicar en ella los archivos `.parquet` proporcionados.  
Esta carpeta debe estar en el mismo directorio que los notebooks.

---

# 1. Comprensión de los datos

En esta fase se realizó un análisis exhaustivo de todas las tablas disponibles para entender su estructura, calidad y relación entre ellas.

## Dataset principal

- **`application_train`**
  - 307.511 registros
  - 122 columnas
  - Tabla central del proyecto
  - Única tabla que contiene la variable objetivo `TARGET`

## Tablas secundarias

- `bureau`
- `bureau_balance`
- `previous_application`
- `POS_CASH_balance`
- `installments_payments`
- `credit_card_balance`

Cada tabla aporta información histórica del comportamiento financiero del cliente en distintos contextos.

---

## Exploración inicial

Se aplicó una función genérica de **Data Understanding** a todas las tablas, obteniendo:

- Dimensiones (filas, columnas)
- Tipos de datos
- Cantidad de variables numéricas y categóricas
- Porcentaje de valores nulos
- Detección de columnas constantes
- Identificación de filas duplicadas
- Estadísticas descriptivas

### Hallazgos clave

- Alta presencia de **valores nulos estructurales** (>50%) en variables de características físicas de la vivienda.
- Presencia de **variables altamente correlacionadas** (versiones AVG, MODE, MEDI).
- Variables categóricas con **alta cardinalidad** (ej. `ORGANIZATION_TYPE`).
- Dataset fuertemente **desbalanceado**:
  - `TARGET = 1` ≈ **8%**
  - `TARGET = 0` ≈ **92%**

---

## Ingeniería de características inicial

Se crearon variables derivadas para mejorar la interpretabilidad:

- `AGE_YEARS` a partir de `DAYS_BIRTH`
- `EMPLOYED_YEARS` a partir de `DAYS_EMPLOYED`

---

# 2. Preparación de los datos

Esta fue la fase más extensa y crítica del proyecto.

## Construcción del dataset base

- Se creó un dataset llamado **`data_set_base`** a partir de `application_train`
- Todas las tablas secundarias se procesaron y agregaron **a nivel cliente (`SK_ID_CURR`)**
- Se utilizó una **función genérica reutilizable** para:
  - Limpieza
  - Transformaciones
  - Agregaciones jerárquicas
  - Generación de variables semánticas

---

## Preparación de tablas secundarias

### Ejemplo: `bureau_balance`

- Conversión de `STATUS` a meses de atraso numéricos
- Eliminación de `MONTHS_BALANCE` por no aportar señal al resumir
- Agregación a nivel crédito y luego a nivel cliente

Variables generadas:
- `bureau_avg_months_past_due`
- `bureau_max_months_past_due`
- `bureau_max_avg_months_past_due`

Este mismo enfoque se aplicó a:
- `bureau`
- `previous_application`
- `POS_CASH_balance`
- `installments_payments`
- `credit_card_balance`

---

## Eliminación de columnas irrelevantes o ruidosas

Se eliminaron variables según criterios claros y justificados:

### Ruido estructural
- Flags de documentos (`FLAG_DOCUMENT_2` a `FLAG_DOCUMENT_21`)
- Variables del proceso de solicitud (día y hora)
- Variables de desajuste región/ciudad

### Redundancia
- Versiones `_AVG`, `_MODE`, `_MEDI`
- Variables altamente correlacionadas (`corr > 0.85`)
- Variables duplicadas conceptualmente

### Baja varianza
- Se aplicó `VarianceThreshold (0.01)`
- Eliminación de variables casi constantes

### Alta cardinalidad categórica
- `ORGANIZATION_TYPE`
- `OCCUPATION_TYPE`
- `NAME_TYPE_SUITE`

---

## Tratamiento de valores nulos

### Nulos estructurales
- Variables históricas (ej. tarjetas, créditos previos)
- Se imputaron con **0**, interpretado como:
  > “No existe historial para este cliente”

### Variables numéricas
- Imputación con **mediana**
- Robusta ante asimetría y outliers

---

## Encoding de variables categóricas

### Ordinal Encoding
- `NAME_EDUCATION_TYPE` → `EDU_LEVEL`

### One-Hot Encoding
- Variables nominales como:
  - Tipo de contrato
  - Género
  - Estado civil
  - Tipo de vivienda
  - Tipo de ingreso

Resultado:
- Dataset completamente **numérico**
- **105 columnas finales**

---

## Escalado

Se aplicó **MinMaxScaler**:

- Escala todas las variables a rango `[0, 1]`
- Mejor comportamiento frente a outliers
- Compatible con modelos lineales y árboles

---

# 3. Modelamiento

Se probaron múltiples modelos supervisados, considerando el fuerte desbalance de clases.

## Modelos evaluados

- Regresión Logística
- Random Forest
- Gradient Boosting
- XGBoost
- LightGBM

---

## Métricas utilizadas

- Precision (clase 1)
- Recall (clase 1)
- F1-score
- Accuracy (solo referencial)
- **ROC AUC** (métrica principal)

---

## Resultados comparativos

| Modelo | Recall (1) | F1 (1) | ROC AUC |
|------|-----------|--------|---------|
| Logistic Regression | 0.55 | 0.19 | 0.63 |
| Random Forest | 0.52 | 0.31 | 0.77 |
| Gradient Boosting | 0.02 | 0.03 | 0.77 |
| XGBoost | 0.69 | 0.28 | 0.78 |
| **LightGBM** | **0.68** | **0.29** | **0.78** |

**Modelo seleccionado:** **LightGBM**

---

# 4. Evaluación

El modelo final logra:

- Identificar correctamente una alta proporción de clientes riesgosos
- Mantener un buen balance entre falsos positivos y falsos negativos
- Superar consistentemente a modelos lineales y no balanceados

Se realizaron:
- Ajustes de umbral
- Comparaciones con SMOTE
- Validación en conjunto de test

---

# 5. Despliegue

El modelo fue desplegado exitosamente en un entorno productivo real.

## Arquitectura

- Modelo serializado (`.pkl`)
- FastAPI como backend
- Apache como reverse proxy
- systemd para ejecución persistente
- Servidor: Raspberry Pi

## Endpoints

- **Predicción**

# Proyecto de Machine Learning

## Predicción de Riesgo Crediticio (Home Credit)

Este proyecto desarrolla un **flujo completo de Machine Learning supervisado** para la **predicción de incumplimiento de pago** en solicitudes de crédito utilizando el dataset de **Home Credit**.

El trabajo se estructura en **cuatro fases principales**:

1. **Comprensión de los datos**
2. **Preparación de los datos**
3. **Modelamiento**
4. **Evaluación y despliegue**

El objetivo final es construir, evaluar y desplegar un modelo capaz de **estimar la probabilidad de incumplimiento (`TARGET = 1`)**, priorizando métricas relevantes para problemas desbalanceados como **Recall, F1-score y ROC AUC**.

Para ejecutar correctamente el proyecto es necesario crear una carpeta llamada `datos_examen` y ubicar en ella los archivos `.parquet` proporcionados.  
Esta carpeta debe estar en el mismo directorio que los notebooks.

---

# 1. Comprensión de los datos

En esta fase se realizó un análisis exhaustivo de todas las tablas disponibles para entender su estructura, calidad y relación entre ellas.

## Dataset principal

- **`application_train`**
  - 307.511 registros
  - 122 columnas
  - Tabla central del proyecto
  - Única tabla que contiene la variable objetivo `TARGET`

## Tablas secundarias

- `bureau`
- `bureau_balance`
- `previous_application`
- `POS_CASH_balance`
- `installments_payments`
- `credit_card_balance`

Cada tabla aporta información histórica del comportamiento financiero del cliente en distintos contextos.

---

## Exploración inicial

Se aplicó una función genérica de **Data Understanding** a todas las tablas, obteniendo:

- Dimensiones (filas, columnas)
- Tipos de datos
- Cantidad de variables numéricas y categóricas
- Porcentaje de valores nulos
- Detección de columnas constantes
- Identificación de filas duplicadas
- Estadísticas descriptivas

### Hallazgos clave

- Alta presencia de **valores nulos estructurales** (>50%) en variables de características físicas de la vivienda.
- Presencia de **variables altamente correlacionadas** (versiones AVG, MODE, MEDI).
- Variables categóricas con **alta cardinalidad** (ej. `ORGANIZATION_TYPE`).
- Dataset fuertemente **desbalanceado**:
  - `TARGET = 1` ≈ **8%**
  - `TARGET = 0` ≈ **92%**

---

## Ingeniería de características inicial

Se crearon variables derivadas para mejorar la interpretabilidad:

- `AGE_YEARS` a partir de `DAYS_BIRTH`
- `EMPLOYED_YEARS` a partir de `DAYS_EMPLOYED`

---

# 2. Preparación de los datos

Esta fue la fase más extensa y crítica del proyecto.

## Construcción del dataset base

- Se creó un dataset llamado **`data_set_base`** a partir de `application_train`
- Todas las tablas secundarias se procesaron y agregaron **a nivel cliente (`SK_ID_CURR`)**
- Se utilizó una **función genérica reutilizable** para:
  - Limpieza
  - Transformaciones
  - Agregaciones jerárquicas
  - Generación de variables semánticas

---

## Preparación de tablas secundarias

### Ejemplo: `bureau_balance`

- Conversión de `STATUS` a meses de atraso numéricos
- Eliminación de `MONTHS_BALANCE` por no aportar señal al resumir
- Agregación a nivel crédito y luego a nivel cliente

Variables generadas:
- `bureau_avg_months_past_due`
- `bureau_max_months_past_due`
- `bureau_max_avg_months_past_due`

Este mismo enfoque se aplicó a:
- `bureau`
- `previous_application`
- `POS_CASH_balance`
- `installments_payments`
- `credit_card_balance`

---

## Eliminación de columnas irrelevantes o ruidosas

Se eliminaron variables según criterios claros y justificados:

### Ruido estructural
- Flags de documentos (`FLAG_DOCUMENT_2` a `FLAG_DOCUMENT_21`)
- Variables del proceso de solicitud (día y hora)
- Variables de desajuste región/ciudad

### Redundancia
- Versiones `_AVG`, `_MODE`, `_MEDI`
- Variables altamente correlacionadas (`corr > 0.85`)
- Variables duplicadas conceptualmente

### Baja varianza
- Se aplicó `VarianceThreshold (0.01)`
- Eliminación de variables casi constantes

### Alta cardinalidad categórica
- `ORGANIZATION_TYPE`
- `OCCUPATION_TYPE`
- `NAME_TYPE_SUITE`

---

## Tratamiento de valores nulos

### Nulos estructurales
- Variables históricas (ej. tarjetas, créditos previos)
- Se imputaron con **0**, interpretado como:
  > “No existe historial para este cliente”

### Variables numéricas
- Imputación con **mediana**
- Robusta ante asimetría y outliers

---

## Encoding de variables categóricas

### Ordinal Encoding
- `NAME_EDUCATION_TYPE` → `EDU_LEVEL`

### One-Hot Encoding
- Variables nominales como:
  - Tipo de contrato
  - Género
  - Estado civil
  - Tipo de vivienda
  - Tipo de ingreso

Resultado:
- Dataset completamente **numérico**
- **105 columnas finales**

---

## Escalado

Se aplicó **MinMaxScaler**:

- Escala todas las variables a rango `[0, 1]`
- Mejor comportamiento frente a outliers
- Compatible con modelos lineales y árboles

---

# 3. Modelamiento

Se probaron múltiples modelos supervisados, considerando el fuerte desbalance de clases.

## Modelos evaluados

- Regresión Logística
- Random Forest
- Gradient Boosting
- XGBoost
- LightGBM

---

## Métricas utilizadas

- Precision (clase 1)
- Recall (clase 1)
- F1-score
- Accuracy (solo referencial)
- **ROC AUC** (métrica principal)

---

## Resultados comparativos

| Modelo | Recall (1) | F1 (1) | ROC AUC |
|------|-----------|--------|---------|
| Logistic Regression | 0.55 | 0.19 | 0.63 |
| Random Forest | 0.52 | 0.31 | 0.77 |
| Gradient Boosting | 0.02 | 0.03 | 0.77 |
| XGBoost | 0.69 | 0.28 | 0.78 |
| **LightGBM** | **0.68** | **0.29** | **0.78** |

**Modelo seleccionado:** **LightGBM**

---

# 4. Evaluación

El modelo final logra:

- Identificar correctamente una alta proporción de clientes riesgosos
- Mantener un buen balance entre falsos positivos y falsos negativos
- Superar consistentemente a modelos lineales y no balanceados

Se realizaron:
- Ajustes de umbral
- Comparaciones con SMOTE
- Validación en conjunto de test

---

# 5. Despliegue

El modelo fue desplegado exitosamente en un entorno productivo real.

## Arquitectura

- Modelo serializado (`.pkl`)
- FastAPI como backend
- Apache como reverse proxy
- systemd para ejecución persistente
- Servidor: Raspberry Pi

## Endpoints

- **Predicción**
POST https://www.ezsuarez.org/api/predict

- **Health check**
GET https://www.ezsuarez.org/api/health


---

# 6. Conclusión

Este proyecto demuestra un **pipeline completo y profesional de Machine Learning**, abordando correctamente:

- Integración de múltiples fuentes de datos
- Limpieza y reducción de dimensionalidad
- Manejo de desbalance severo
- Comparación de múltiples modelos
- Selección basada en métricas adecuadas
- Despliegue real en producción

El modelo final **LightGBM** ofrece el mejor compromiso entre capacidad predictiva y estabilidad, siendo adecuado para un sistema de apoyo a decisiones de riesgo crediticio.
