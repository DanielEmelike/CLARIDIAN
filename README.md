<img width="1919" height="891" alt="1_main-db" src="https://github.com/user-attachments/assets/d0cde828-d8fc-4599-9d48-e613bea72dd3" />


## CLARIDIAN: Clarity and Guardian for Psychosis Risk Assessment

CLARIDIAN.ai is a prototype web application designed to assess an individual's transition risk for psychosis using a clinically transparent and explainable AI model. The system leverages an Adaptive Neuro-Fuzzy Inference System (ANFIS) to blend subjective clinical observations with quantifiable metrics, generating a precise, actionable Psychosis Risk Score (0-100%).

The project emphasizes Explainability (XAI) by using Fuzzy Logic, making the system's decision-making process traceable and understandable by clinicians.

### Core Technology Stack

- **Backend & Logic:** Python, Flask, and the `scikit-fuzzy` library.

- **Frontend & Visualization:** HTML5, CSS3, JavaScript, and ECharts.

- **Core Model:** Adaptive Neuro-Fuzzy Inference System (ANFIS).

### How the ANFIS Model Works

CLARIDIAN processes six key clinical inputs and uses a four-layer ANFIS structure to determine the final risk score.

**1. Input & Fuzzification Layer**
   
The system receives scores (0-10) for six critical neuro-metrics:

| Core Metric | Extended Metric |
| :--- | :--- |
| **Suspiciousness** (Positive Symptom) | **Social Withdrawal** (Negative Symptom) |
| **Acoustic Coherence** (Disorganization) | **Attention/Working Memory** (Cognitive) |
| **Sleep Quality Index** (Auxiliary) | **Role Functioning Score** (Functional Outcome) |

These inputs are converted into linguistic terms (e.g., 'Low', 'Moderate') using Membership Functions.


**2. Rule Layer (Inference Engine)**

The system contains a Rule Base of fuzzy logic rules that emulate clinical reasoning. For example:

`IF Suspiciousness is Sub-clinical AND Acoustic Coherence is Low THEN Risk is High`.

`IF Role Functioning is Intact AND Acoustic Coherence is High THEN Risk is Low`.

**3. Defuzzification Layer**

The aggregated fuzzy output is processed to yield a single, crisp Psychosis Risk Score (0-100%).

Features and Visualization

- **Risk Visualization:** The score is displayed on a dynamic ECharts Gauge, instantly classifying the result as Low, Moderate, or High Risk.

- **Actionable Health Plan:** Based on the risk level, the dashboard generates a Preventative Action Plan and a Health Plan Timeline, detailing clinical next steps (e.g., CBT, Diagnostic Interview).

- **Transparency Tool:** A dedicated page visually explains the ANFIS architecture, the Membership Functions, and the Rule Base, ensuring clinical confidence.

### Installation and Setup

**1. Clone the repository:**

```bash
git clone [your_repo_link]
cd Claridian
```

**2. Set up the Python environment (for the Flask API):**

```bash
pip install Flask numpy scikit-fuzzy flask-cors
```

**3. Run the Flask server:**

```bash
python EON_app.py
```

**Note:** The server must run on `http://127.0.0.1:5000` to communicate with the frontend.

**4. Open the Dashboard:** Navigate to the `Claridian_home.html` file in your web browser.
