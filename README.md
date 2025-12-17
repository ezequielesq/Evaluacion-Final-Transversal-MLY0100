# Proyecto de Machine Learning

## Predicción de Riesgo Crediticio (Home Credit)

Este proyecto desarrolla un **flujo completo de Machine Learning supervisado** para la **predicción de incumplimiento de pago** en solicitudes de crédito utilizando el dataset de **Home Credit**.

El trabajo se estructura en **cuatro fases principales**:

1. **Comprensión de los datos**
2. **Preparación de los datos**
3. **Modelamiento**
4. **Evaluación y despliegue**

El objetivo final es construir, evaluar y desplegar un modelo capaz de **estimar la probabilidad de incumplimiento (`TARGET = 1`)**, priorizando métricas relevantes para problemas desbalanceados **Recall, F1-score y ROC AUC**.

Para ejecutar correctamente el proyecto, es necesario crear una carpeta denominada `datos_examen` y ubicar en ella los archivos con extensión `.parquet` proporcionados para el análisis.  
Esta carpeta debe encontrarse en el mismo directorio raíz donde se ubican las carpetas que contienen los notebooks del proyecto, de modo que las rutas de carga de datos funcionen correctamente.

Adicionalmente, es obligatorio instalar las librerías necesarias para la ejecución del proyecto.  
El listado de dependencias se encuentra especificado en un archivo `.txt` ubicado en la carpeta raiz, bajo el nombre **`Dependencias`**, el cual debe utilizarse para instalar el entorno requerido antes de ejecutar los notebooks.

---

# 1. Comprensión de los datos

En esta fase se realizó un análisis de todas las tablas disponibles para entender su estructura, calidad y relación entre ellas.

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

### Hallazgos

- Alta presencia de **valores nulos estructurales** (>50%) en variables de características físicas de la vivienda.
- Presencia de **variables altamente correlacionadas** (versiones AVG, MODE, MEDI).
- Variables categóricas con **alta cardinalidad** (`ORGANIZATION_TYPE`).
- Dataset fuertemente **desbalanceado**:
  - `TARGET = 1` ≈ **8%**
  - `TARGET = 0` ≈ **92%**

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

Se eliminaron variables según los siguientes criterios:

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
- Variables históricas (tarjetas, créditos previos)
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

El modelo final seleccionado logra:

- Identificar correctamente una proporción significativa de clientes con alto riesgo de incumplimiento,
reflejado en valores de **Recall cercanos a 0.68** para la clase minoritaria.
- Mantener una capacidad de discriminación entre clientes riesgosos y no riesgosos,
con valores de **ROC AUC cercanos a 0.78**, lo que indica que el modelo aprende patrones relevantes
del comportamiento crediticio.
- Superar de forma consistente a modelos lineales y enfoques no balanceados, especialmente en términos
de detección de la clase minoritaria.

Durante esta fase se realizaron distintas estrategias de validación y comparación, entre ellas:
- Ajustes del umbral de decisión para analizar el impacto en Recall y F1-score.
- Comparaciones experimentales con técnicas de sobremuestreo como **SMOTE**.
- Evaluación final sobre un conjunto de prueba independiente, evitando el uso de métricas optimistas.

Si bien el modelo presenta un desempeño adecuado en términos de detección de riesgo,
se observan valores moderados de **F1-score**, lo que evidencia la presencia de una cantidad relevante
de falsos positivos. Este comportamiento es coherente con la priorización del Recall en un contexto
de riesgo crediticio, pero representa una limitación a considerar.

---

# 5. Despliegue

La interfaz web es accesible desde https://www.ezsuarez.org/Prediccion/#/dashboard

La interfaz web permite seleccionar automáticamente un ejemplo de entrada válido, visualizar y editar el JSON correspondiente y enviarlo al modelo para obtener una predicción. El resultado se muestra junto con la probabilidad de riesgo.

## Arquitectura

- Modelo serializado (`.pkl`)
- FastAPI como backend
- Angular como frontend
- Apache como reverse proxy
- systemd para ejecución persistente
- Servidor: Raspberry Pi

## Endpoints

- **Predicción**
POST https://www.ezsuarez.org/api/predict

- **Health check**
GET https://www.ezsuarez.org/api/health

---

# 6. Conclusión y Análisis Crítico

Este proyecto demuestra la implementación de un **pipeline completo**,
abarcando todas las etapas del ciclo de vida del modelo, desde la comprensión del problema hasta
su despliegue.

A lo largo del desarrollo se abordaron de manera sistemática los principales desafíos del problema,
incluyendo:
- La integración de múltiples fuentes de datos heterogéneas.
- La limpieza, transformación y reducción de dimensionalidad de un dataset.
- El manejo explícito de un fuerte desbalance de clases.
- La comparación de distintos modelos de clasificación.
- La selección del modelo final en función de métricas adecuadas al problema.
- El despliegue del modelo mediante una arquitectura real basada en FastAPI y Apache.

El modelo **LightGBM** fue seleccionado como solución final al ofrecer el mejor equilibrio entre
capacidad predictiva, estabilidad y detección de clientes riesgosos, alcanzando un **ROC AUC cercano
a 0.78** y un **Recall aproximado de 0.68** para la clase de interés.

No obstante, desde una perspectiva crítica, los resultados obtenidos **no se consideran suficientes
para un uso en producción**. La priorización del Recall se logra a costa
de una baja precisión, reflejada en valores de F1-score moderados, lo que implicaría un número relevante
de falsos positivos en un entorno real.

### Posibles mejoras futuras

Para avanzar hacia una solución apta para producción, se identifican las siguientes líneas de mejora:
- Optimización del umbral de decisión basada en costos de negocio.
- Implementación de enfoques *cost-sensitive learning*.
- Integración del preprocesamiento completo dentro de un pipeline reproducible.

En conclusión, el proyecto cumple satisfactoriamente con los objetivos académicos propuestos
y demuestra una comprensión sólida del problema de riesgo crediticio, dejando claramente identificadas
las limitaciones actuales del modelo y los pasos necesarios para su evolución hacia un sistema
de apoyo a decisiones en un entorno real.

