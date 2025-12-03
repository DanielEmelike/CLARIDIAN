import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- FUZZY INFERENCE SYSTEM  ---

input_range = np.arange(0, 11, 1)
risk_range = np.arange(0, 101, 1)  # Psychosis Risk Score (0-100)

# Core Metrics
Suspiciousness = ctrl.Antecedent(input_range, 'Suspiciousness')
AcousticCoherence = ctrl.Antecedent(input_range, 'AcousticCoherence')
SleepQuality = ctrl.Antecedent(input_range, 'SleepQuality')

# Extended Metrics
SocialWithdrawal = ctrl.Antecedent(input_range, 'SocialWithdrawal')
Attention = ctrl.Antecedent(input_range, 'Attention')
RoleFunctioning = ctrl.Antecedent(input_range, 'RoleFunctioning')

# Output Fuzzy Set
RiskScore = ctrl.Consequent(risk_range, 'RiskScore')

# Membership Functions (Fuzzification)
Suspiciousness['Low'] = fuzz.trimf(input_range, [0, 0, 4])
Suspiciousness['Moderate'] = fuzz.trimf(input_range, [2, 5, 8])
Suspiciousness['Sub-clinical'] = fuzz.trimf(input_range, [6, 10, 10])

AcousticCoherence['Low'] = fuzz.trimf(input_range, [0, 0, 5])
AcousticCoherence['Medium'] = fuzz.trimf(input_range, [3, 6, 8])
AcousticCoherence['High'] = fuzz.trimf(input_range, [6, 10, 10])

SleepQuality['Poor'] = fuzz.trimf(input_range, [0, 0, 4])
SleepQuality['Average'] = fuzz.trimf(input_range, [3, 5, 8])
SleepQuality['Good'] = fuzz.trimf(input_range, [6, 10, 10])

SocialWithdrawal['Low'] = fuzz.trimf(input_range, [0, 0, 4])
SocialWithdrawal['Moderate'] = fuzz.trimf(input_range, [2, 5, 8])
SocialWithdrawal['High'] = fuzz.trimf(input_range, [6, 10, 10])

Attention['Intact'] = fuzz.trimf(input_range, [0, 0, 4])
Attention['Impaired'] = fuzz.trimf(input_range, [3, 6, 8])
Attention['Severe'] = fuzz.trimf(input_range, [6, 10, 10])

RoleFunctioning['Intact'] = fuzz.trimf(input_range, [0, 0, 3])  # Lower threshold for "good" functioning
RoleFunctioning['Decline'] = fuzz.trimf(input_range, [2, 5, 8])
RoleFunctioning['Severe_Decline'] = fuzz.trimf(input_range, [7, 10, 10])

# Risk Score MFs
RiskScore['Low'] = fuzz.trimf(risk_range, [0, 0, 35])
RiskScore['Medium'] = fuzz.trimf(risk_range, [20, 50, 80])
RiskScore['High'] = fuzz.trimf(risk_range, [65, 100, 100])

# Fuzzy Rules (Inference Engine)
rules = []

# --- HIGH RISK RULES (Aggressive Combinations) ---
# High Positive/Disorganization Symptoms + Functional/Social Decline
rules.append(ctrl.Rule(Suspiciousness['Sub-clinical'] & AcousticCoherence['Low'], RiskScore['High']))
rules.append(ctrl.Rule(SocialWithdrawal['High'] & RoleFunctioning['Severe_Decline'], RiskScore['High']))
rules.append(ctrl.Rule(Suspiciousness['Sub-clinical'] | RoleFunctioning['Severe_Decline'], RiskScore['High']))

# High Positive Symptoms + Lack of Protective Factors
rules.append(ctrl.Rule(Suspiciousness['Sub-clinical'] & SleepQuality['Poor'] & Attention['Severe'], RiskScore['High']))
rules.append(ctrl.Rule(AcousticCoherence['Low'] & RoleFunctioning['Severe_Decline'], RiskScore['High']))

# --- MEDIUM RISK RULES (Moderate Symptoms or Mix) ---
# Moderate Positive/Negative/Cognitive Symptoms
rules.append(ctrl.Rule(Suspiciousness['Moderate'] & SocialWithdrawal['Moderate'], RiskScore['Medium']))
rules.append(ctrl.Rule(AcousticCoherence['Medium'] & Attention['Impaired'], RiskScore['Medium']))

# Moderate Protective Factor Erosion
rules.append(ctrl.Rule(SleepQuality['Poor'] & Attention['Impaired'], RiskScore['Medium']))
rules.append(ctrl.Rule(RoleFunctioning['Decline'] & Suspiciousness['Low'], RiskScore['Medium']))

# Combination of multiple mild/moderate factors
rules.append(
    ctrl.Rule(SocialWithdrawal['Moderate'] & Attention['Impaired'] & RoleFunctioning['Decline'], RiskScore['Medium']))
rules.append(
    ctrl.Rule(Suspiciousness['Moderate'] & AcousticCoherence['Medium'] & SleepQuality['Average'], RiskScore['Medium']))

# --- LOW RISK RULES (Protective Factors) ---
rules.append(ctrl.Rule(Suspiciousness['Low'] & SocialWithdrawal['Low'], RiskScore['Low']))
rules.append(ctrl.Rule(SleepQuality['Good'] & Attention['Intact'], RiskScore['Low']))
rules.append(ctrl.Rule(RoleFunctioning['Intact'] & AcousticCoherence['High'], RiskScore['Low']))
rules.append(ctrl.Rule(RoleFunctioning['Intact'] & SleepQuality['Good'], RiskScore['Low']))

# Control System and Simulation
risk_ctrl = ctrl.ControlSystem(rules)
risk_sim = ctrl.ControlSystemSimulation(risk_ctrl)


# --- API ENDPOINT ---
@app.route('/api/assess_risk', methods=['POST'])
def assess_risk():
    """
    Receives input data and calculates the Fuzzy Risk Score using the EON core.
    """
    data = request.get_json()

    # Input Validation and Assignment (Clamping values 0-10)
    try:
        susp_input = max(0, min(10, float(data.get('suspiciousness', 5))))
        coh_input = max(0, min(10, float(data.get('coherence', 5))))
        sleep_input = max(0, min(10, float(data.get('sleep', 5))))
        social_withdrawal_input = max(0, min(10, float(data.get('social_withdrawal', 5))))
        attention_input = max(0, min(10, float(data.get('attention', 5))))
        functioning_input = max(0, min(10, float(data.get('functioning', 5))))

    except ValueError:
        return jsonify({"error": "Invalid input values. Must be numeric."}), 400

    # ANFIS/Fuzzy Calculation Setup
    risk_sim.input['Suspiciousness'] = susp_input
    risk_sim.input['AcousticCoherence'] = coh_input
    risk_sim.input['SleepQuality'] = sleep_input
    risk_sim.input['SocialWithdrawal'] = social_withdrawal_input
    risk_sim.input['Attention'] = attention_input
    risk_sim.input['RoleFunctioning'] = functioning_input

    try:
        risk_sim.compute()

        # Check if the 'RiskScore' was calculated
        if 'RiskScore' in risk_sim.output:
            risk_value = risk_sim.output['RiskScore']

            # Check for NaN result
            if np.isnan(risk_value):
                risk_percent = 50.0
                triggered_rules = [
                    "Default Rule: System assigned a Moderate Risk (50%) because the exact input combination was not fully mapped."]
            else:
                risk_percent = round(risk_value, 1)

                # Simplified Interpretation based on final score:
                if risk_percent >= 65:
                    triggered_rules = [
                        "High correlation detected across positive, negative, and functional decline metrics."]
                elif risk_percent >= 35:
                    triggered_rules = [
                        "Moderate symptom profile detected. Multiple minor deficits are accumulating."]
                else:
                    triggered_rules = [
                        "Low symptom profile detected. Protective factors and good functioning are the main drivers."]

        else:
            # Fallback
            risk_percent = 50.0
            triggered_rules = [
                "Default Rule: System assigned a **Moderate Risk (50%)** due to unmapped input combination."]

        # Return Final Risk Assessment
        risk_level = "High" if risk_percent >= 65 else ("Moderate" if risk_percent >= 35 else "Low")

        return jsonify({
            "risk_score": risk_percent,
            "interpretation_text": f"The calculated Psychosis Risk Score is **{risk_percent}%** (Membership in 'High Risk' set: {risk_percent / 100:.2f}).",
            "risk_level": risk_level,
            "triggered_fuzzy_rules": triggered_rules
        })

    except ValueError as e:
        # Handles cases where the system fails to compute entirely
        print(f"Fuzzy computation error: {e}")
        return jsonify({"error": "System Error: Could not compute risk score. Check input ranges."}), 500


# Run the server
if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)