"use client";
import React, { useState } from "react";

const InfusionPumpCalculator = () => {
  const MEDICATION_SAFETY_LIMITS = {
    insulin: { max_rate: 50, max_concentration: 100, unit: "units/hr" },
    heparin: { max_rate: 25000, max_concentration: 25000, unit: "units/hr" },
    morphine: { max_rate: 30, max_concentration: 10, unit: "mg/hr" },
    fentanyl: { max_rate: 0.5, max_concentration: 0.05, unit: "mg/hr" },
    propofol: { max_rate: 200, max_concentration: 10, unit: "mg/hr" },
    norepinephrine: { max_rate: 0.5, max_concentration: 0.1, unit: "mg/hr" },
    default: { max_rate: 999, max_concentration: 1000, unit: "mg/hr" },
  };

  const [inputs, setInputs] = useState({
    medication: "morphine",
    concentration: "1.0",
    patient_weight: "70",
    dose_required: "0.1",
    dose_unit: "mg_kg_hr",
    infusion_duration: "24",
    max_infusion_rate: "100",
    bolus_dose: "2",
    bolus_duration: "5",
    reservoir_volume: "100",
  });

  const [results, setResults] = useState(null);

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const calculateDoseRate = (dose_required, patient_weight, dose_unit) => {
    switch (dose_unit) {
      case "mg_kg_hr":
        return dose_required * patient_weight;
      case "mg_kg_min":
        return dose_required * patient_weight * 60;
      case "mg_min":
        return dose_required * 60;
      case "mcg_kg_min":
        return (dose_required * patient_weight * 60) / 1000;
      case "units_hr":
        return dose_required;
      default:
        throw new Error(`Unsupported dose unit: ${dose_unit}`);
    }
  };

  const calculate = () => {
    try {
      const medication = inputs.medication.toLowerCase();
      const concentration = parseFloat(inputs.concentration);
      const patient_weight = parseFloat(inputs.patient_weight);
      const dose_required = parseFloat(inputs.dose_required);
      const dose_unit = inputs.dose_unit;
      const infusion_duration = parseFloat(inputs.infusion_duration);
      const max_infusion_rate = parseFloat(inputs.max_infusion_rate);
      const bolus_dose = parseFloat(inputs.bolus_dose);
      const bolus_duration = parseFloat(inputs.bolus_duration);
      const reservoir_volume = parseFloat(inputs.reservoir_volume);

      if (patient_weight <= 0)
        throw new Error("Patient weight must be positive");
      if (concentration <= 0) throw new Error("Concentration must be positive");
      if (infusion_duration <= 0)
        throw new Error("Infusion duration must be positive");

      const dose_rate_mg_hr = calculateDoseRate(
        dose_required,
        patient_weight,
        dose_unit
      );

      const infusion_rate_ml_hr = dose_rate_mg_hr / concentration;
      const total_volume_ml = infusion_rate_ml_hr * infusion_duration;
      const total_medication_mg = dose_rate_mg_hr * infusion_duration;

      let bolus_params = null;
      if (bolus_dose > 0) {
        if (bolus_duration <= 0) {
          throw new Error(
            "Bolus duration must be positive if bolus dose is given"
          );
        }
        const bolus_volume_ml = bolus_dose / concentration;
        const bolus_rate_ml_hr = (bolus_volume_ml / bolus_duration) * 60;
        bolus_params = {
          bolus_dose_mg: bolus_dose,
          bolus_volume_ml,
          bolus_duration_min: bolus_duration,
          bolus_rate_ml_hr,
        };
      }

      const safety_info =
        MEDICATION_SAFETY_LIMITS[medication] ||
        MEDICATION_SAFETY_LIMITS.default;
      const warnings = [];
      const errors = [];

      if (infusion_rate_ml_hr > max_infusion_rate) {
        errors.push(
          `Infusion rate ${infusion_rate_ml_hr.toFixed(
            2
          )} mL/hr exceeds pump limit ${max_infusion_rate} mL/hr`
        );
      }

      if (dose_rate_mg_hr > safety_info.max_rate) {
        warnings.push(
          `Dose rate ${dose_rate_mg_hr.toFixed(
            2
          )} mg/hr exceeds recommended maximum ${
            safety_info.max_rate
          } mg/hr for ${medication}`
        );
      }

      if (concentration > safety_info.max_concentration) {
        warnings.push(
          `Concentration ${concentration} mg/mL exceeds recommended maximum ${safety_info.max_concentration} mg/mL for ${medication}`
        );
      }

      if (infusion_rate_ml_hr < 0.5) {
        warnings.push(
          "Very low infusion rate detected - risk of under-infusion"
        );
      }

      if (bolus_params && bolus_params.bolus_rate_ml_hr > max_infusion_rate) {
        errors.push(
          `Bolus rate ${bolus_params.bolus_rate_ml_hr.toFixed(
            2
          )} mL/hr exceeds pump limit`
        );
      }

      const time_to_empty_hours =
        infusion_rate_ml_hr > 0 ? reservoir_volume / infusion_rate_ml_hr : 0;
      if (time_to_empty_hours < infusion_duration) {
        warnings.push(
          `Reservoir will empty in ${time_to_empty_hours.toFixed(
            1
          )} hours - monitor for refill`
        );
      }

      // Generate results
      const completion = new Date(Date.now() + infusion_duration * 3600000);

      let status = "SAFE";
      if (errors.length > 0) status = "ERROR";
      else if (warnings.length > 0) status = "WARNING";

      setResults({
        status,
        medication: inputs.medication,
        patient_weight_kg: patient_weight,
        infusion_parameters: {
          dose_rate_mg_hr,
          infusion_rate_ml_hr,
          total_volume_ml,
          total_medication_mg,
        },
        pump_programming: {
          vtbi_ml: total_volume_ml,
          rate_ml_hr: infusion_rate_ml_hr,
          dose_rate_mg_hr,
          concentration_mg_ml: concentration,
          estimated_completion: completion,
        },
        bolus_parameters: bolus_params,
        safety_validation: {
          warnings,
          errors,
          safety_limits_applied: safety_info,
          time_to_empty_hours,
        },
        calculation_timestamp: new Date(),
      });
    } catch (e) {
      setResults({
        status: "ERROR",
        error_message: e.message,
        calculation_timestamp: new Date(),
      });
    }
  };

  const getStatusInfo = () => {
    if (!results)
      return { text: "● Awaiting calculation", color: "text-gray-400" };
    if (results.status === "ERROR")
      return { text: "✖ ERROR - Cannot proceed", color: "text-red-500" };
    if (results.status === "WARNING")
      return { text: "⚠ WARNING - Review required", color: "text-orange-500" };
    return { text: "● SAFE - Ready to proceed", color: "text-green-400" };
  };

  const status = getStatusInfo();

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-[#00d4ff] text-center mb-8">
          💉 Infusion Pump Calculator
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-[#16213e] rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-200 mb-6">
              Input Parameters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Medication</label>
                <select
                  value={inputs.medication}
                  onChange={(e) =>
                    handleInputChange("medication", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                >
                  <option value="morphine">Morphine</option>
                  <option value="fentanyl">Fentanyl</option>
                  <option value="propofol">Propofol</option>
                  <option value="insulin">Insulin</option>
                  <option value="heparin">Heparin</option>
                  <option value="norepinephrine">Norepinephrine</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Concentration (mg/mL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.concentration}
                  onChange={(e) =>
                    handleInputChange("concentration", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Patient Weight (kg)
                </label>
                <input
                  type="number"
                  value={inputs.patient_weight}
                  onChange={(e) =>
                    handleInputChange("patient_weight", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Dose Required
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.dose_required}
                  onChange={(e) =>
                    handleInputChange("dose_required", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Dose Unit</label>
                <select
                  value={inputs.dose_unit}
                  onChange={(e) =>
                    handleInputChange("dose_unit", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                >
                  <option value="mg_kg_hr">mg/kg/hr</option>
                  <option value="mg_kg_min">mg/kg/min</option>
                  <option value="mg_min">mg/min</option>
                  <option value="mcg_kg_min">mcg/kg/min</option>
                  <option value="units_hr">units/hr</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Infusion Duration (hrs)
                </label>
                <input
                  type="number"
                  value={inputs.infusion_duration}
                  onChange={(e) =>
                    handleInputChange("infusion_duration", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Max Infusion Rate (mL/hr)
                </label>
                <input
                  type="number"
                  value={inputs.max_infusion_rate}
                  onChange={(e) =>
                    handleInputChange("max_infusion_rate", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Bolus Dose (mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.bolus_dose}
                  onChange={(e) =>
                    handleInputChange("bolus_dose", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Bolus Duration (min)
                </label>
                <input
                  type="number"
                  value={inputs.bolus_duration}
                  onChange={(e) =>
                    handleInputChange("bolus_duration", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">
                  Reservoir Volume (mL)
                </label>
                <input
                  type="number"
                  value={inputs.reservoir_volume}
                  onChange={(e) =>
                    handleInputChange("reservoir_volume", e.target.value)
                  }
                  className="w-full bg-[#0f3460] text-gray-200 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>

              <button
                onClick={calculate}
                className="w-full bg-[#00d4ff] text-[#1a1a2e] font-bold py-3 rounded hover:bg-[#00b8d4] transition-colors cursor-pointer"
              >
                ⚡ CALCULATE
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-[#16213e] rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-200 mb-4">Results</h2>

            <div className={`font-bold mb-6 ${status.color}`}>
              {status.text}
            </div>

            <div className="bg-[#0f3460] rounded p-6 space-y-2 text-gray-200 font-mono text-sm max-h-[600px] overflow-y-auto">
              {results && !results.error_message ? (
                <>
                  <div className="text-[#00d4ff] font-bold mb-4">
                    CALCULATION SUMMARY
                  </div>
                  <div>Medication: {results.medication}</div>
                  <div>Patient Weight: {results.patient_weight_kg} kg</div>
                  <div>Status: {results.status}</div>
                  <div>
                    Timestamp: {results.calculation_timestamp.toLocaleString()}
                  </div>

                  <div className="text-[#00d4ff] font-bold mt-6 mb-4">
                    INFUSION PARAMETERS
                  </div>
                  <div>
                    Dose Rate:{" "}
                    {results.infusion_parameters.dose_rate_mg_hr.toFixed(2)}{" "}
                    mg/hr
                  </div>
                  <div>
                    Infusion Rate:{" "}
                    {results.infusion_parameters.infusion_rate_ml_hr.toFixed(2)}{" "}
                    mL/hr
                  </div>
                  <div>
                    Total Volume:{" "}
                    {results.infusion_parameters.total_volume_ml.toFixed(2)} mL
                  </div>
                  <div>
                    Total Medication:{" "}
                    {results.infusion_parameters.total_medication_mg.toFixed(2)}{" "}
                    mg
                  </div>

                  <div className="text-[#00d4ff] font-bold mt-6 mb-4">
                    PUMP PROGRAMMING
                  </div>
                  <div>
                    VTBI: {results.pump_programming.vtbi_ml.toFixed(2)} mL
                  </div>
                  <div>
                    Rate: {results.pump_programming.rate_ml_hr.toFixed(2)} mL/hr
                  </div>
                  <div>
                    Concentration:{" "}
                    {results.pump_programming.concentration_mg_ml.toFixed(2)}{" "}
                    mg/mL
                  </div>
                  <div>
                    Est. Complete:{" "}
                    {results.pump_programming.estimated_completion
                      .toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                      .replace(",", "")}
                  </div>

                  {results.bolus_parameters && (
                    <>
                      <div className="text-[#00d4ff] font-bold mt-6 mb-4">
                        BOLUS PARAMETERS
                      </div>
                      <div>
                        Bolus Dose:{" "}
                        {results.bolus_parameters.bolus_dose_mg.toFixed(2)} mg
                      </div>
                      <div>
                        Bolus Volume:{" "}
                        {results.bolus_parameters.bolus_volume_ml.toFixed(2)} mL
                      </div>
                      <div>
                        Bolus Duration:{" "}
                        {results.bolus_parameters.bolus_duration_min.toFixed(1)}{" "}
                        min
                      </div>
                      <div>
                        Bolus Rate:{" "}
                        {results.bolus_parameters.bolus_rate_ml_hr.toFixed(2)}{" "}
                        mL/hr
                      </div>
                    </>
                  )}

                  <div className="text-[#00d4ff] font-bold mt-6 mb-4">
                    SAFETY VALIDATION
                  </div>
                  <div>
                    Time to Empty:{" "}
                    {results.safety_validation.time_to_empty_hours.toFixed(1)}{" "}
                    hours
                  </div>
                  <div>
                    Max Rate Limit:{" "}
                    {results.safety_validation.safety_limits_applied.max_rate}{" "}
                    {results.safety_validation.safety_limits_applied.unit}
                  </div>
                  <div>
                    Max Conc Limit:{" "}
                    {
                      results.safety_validation.safety_limits_applied
                        .max_concentration
                    }{" "}
                    mg/mL
                  </div>

                  {results.safety_validation.warnings.length > 0 && (
                    <>
                      <div className="text-orange-500 font-bold mt-6 mb-4">
                        WARNINGS
                      </div>
                      {results.safety_validation.warnings.map((w, i) => (
                        <div key={i} className="text-orange-400">
                          ⚠ {w}
                        </div>
                      ))}
                    </>
                  )}

                  {results.safety_validation.errors.length > 0 && (
                    <>
                      <div className="text-red-500 font-bold mt-6 mb-4">
                        ERRORS
                      </div>
                      {results.safety_validation.errors.map((e, i) => (
                        <div key={i} className="text-red-400">
                          ✖ {e}
                        </div>
                      ))}
                    </>
                  )}
                </>
              ) : results && results.error_message ? (
                <div className="text-red-400">
                  <div className="text-red-500 font-bold mb-4">ERROR</div>
                  <div>✖ {results.error_message}</div>
                  <div className="mt-4 text-gray-400">
                    Timestamp: {results.calculation_timestamp.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">
                  Enter parameters and click Calculate to see results
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfusionPumpCalculator;
