"use client";
import React, { useState, useEffect } from "react";

const BloodPressureMonitor = () => {
  const BP_CATEGORIES = {
    hypotension: { systolic: 90, diastolic: 60, label: "Hypotension" },
    normal: { systolic: 120, diastolic: 80, label: "Normal", color: "#22c55e" },
    elevated: {
      systolic: 130,
      diastolic: 80,
      label: "Elevated",
      color: "#eab308",
    },
    hypertension_stage1: {
      systolic: 140,
      diastolic: 90,
      label: "Stage 1 Hypertension",
      color: "#f97316",
    },
    hypertension_stage2: {
      systolic: 160,
      diastolic: 100,
      label: "Stage 2 Hypertension",
      color: "#dc2626",
    },
    hypertensive_crisis: {
      systolic: 180,
      diastolic: 120,
      label: "Hypertensive Crisis",
      color: "#991b1b",
    },
  };

  const [inputs, setInputs] = useState({
    patient_age: "45",
    patient_weight: "70",
    activity_level: "resting",
    arm_position: "heart_level",
    cuff_size: "adult_standard",
    recent_caffeine: false,
    recent_exercise: false,
  });

  const [results, setResults] = useState(null);
  const [animatedSystolic, setAnimatedSystolic] = useState(0);
  const [animatedDiastolic, setAnimatedDiastolic] = useState(0);
  const [measuring, setMeasuring] = useState(false);

  useEffect(() => {
    if (results && results.blood_pressure && !measuring) {
      const targetSys = results.blood_pressure.systolic_mmhg;
      const targetDia = results.blood_pressure.diastolic_mmhg;

      let currentSys = 0;
      let currentDia = 0;
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;

      const timer = setInterval(() => {
        currentSys += targetSys / steps;
        currentDia += targetDia / steps;

        if (currentSys >= targetSys) {
          currentSys = targetSys;
          currentDia = targetDia;
          clearInterval(timer);
        }

        setAnimatedSystolic(Math.round(currentSys));
        setAnimatedDiastolic(Math.round(currentDia));
      }, interval);

      return () => clearInterval(timer);
    }
  }, [results, measuring]);

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const calculateBloodPressure = () => {
    setMeasuring(true);
    setAnimatedSystolic(0);
    setAnimatedDiastolic(0);

    setTimeout(() => {
      try {
        const age = parseInt(inputs.patient_age);
        const weight = parseFloat(inputs.patient_weight);

        if (age <= 0) throw new Error("Age must be positive");
        if (weight <= 0) throw new Error("Weight must be positive");

        let systolic = 120;

        if (age < 18) {
          systolic = 95 + age * 0.5;
        } else if (age > 30) {
          systolic = 120 + (age - 20) * 0.5;
        }

        let diastolic = 80;

        if (age < 18) {
          diastolic = 60 + age * 0.3;
        } else if (age > 30) {
          diastolic = 80 + (age - 20) * 0.2;
        }

        const activityEffects = {
          resting: { sys: 0, dias: 0 },
          sitting: { sys: 5, dias: 3 },
          standing: { sys: 10, dias: 5 },
          post_exercise: { sys: 30, dias: 15 },
        };
        const activity =
          activityEffects[inputs.activity_level] || activityEffects.resting;
        systolic += activity.sys;
        diastolic += activity.dias;

        const positionEffects = {
          heart_level: 0,
          above_heart: -10,
          below_heart: 10,
        };
        const positionEffect = positionEffects[inputs.arm_position] || 0;
        systolic += positionEffect;
        diastolic += positionEffect;

        const cuffEffects = {
          pediatric: weight > 30 ? 15 : 0,
          adult_small: weight > 70 ? 10 : 0,
          adult_standard: 0,
          adult_large: weight < 50 ? -5 : 0,
          thigh: 5,
        };
        const cuffEffect = cuffEffects[inputs.cuff_size] || 0;
        systolic += cuffEffect;
        diastolic += cuffEffect;

        if (inputs.recent_caffeine) {
          const caffeineEffectSys = 5 + Math.random() * 5;
          const caffeineEffectDias = caffeineEffectSys * 0.5;
          systolic += caffeineEffectSys;
          diastolic += caffeineEffectDias;
        }

        if (inputs.recent_exercise) {
          const exerciseEffectSys = 20 + Math.random() * 10;
          const exerciseEffectDias = 5 + Math.random() * 5;
          systolic += exerciseEffectSys;
          diastolic += exerciseEffectDias;
        }

        systolic += (Math.random() - 0.5) * 6;
        diastolic += (Math.random() - 0.5) * 6;

        systolic = Math.round(systolic);
        diastolic = Math.round(diastolic);

        if (diastolic >= systolic) {
          diastolic = systolic - 20;
        }

        const pulse_pressure = systolic - diastolic;
        const mean_arterial_pressure = Math.round(
          diastolic + pulse_pressure / 3
        );

        let category = "NORMAL";
        let category_description = "Normal blood pressure";

        if (
          systolic < BP_CATEGORIES.hypotension.systolic ||
          diastolic < BP_CATEGORIES.hypotension.diastolic
        ) {
          category = "HYPOTENSION";
          category_description = "Low blood pressure";
        } else if (
          systolic >= BP_CATEGORIES.hypertensive_crisis.systolic ||
          diastolic >= BP_CATEGORIES.hypertensive_crisis.diastolic
        ) {
          category = "HYPERTENSIVE CRISIS";
          category_description = "Medical emergency - seek immediate care";
        } else if (
          systolic >= BP_CATEGORIES.hypertension_stage2.systolic ||
          diastolic >= BP_CATEGORIES.hypertension_stage2.diastolic
        ) {
          category = "HYPERTENSION STAGE 2";
          category_description = "High blood pressure requiring medication";
        } else if (
          systolic >= BP_CATEGORIES.hypertension_stage1.systolic ||
          diastolic >= BP_CATEGORIES.hypertension_stage1.diastolic
        ) {
          category = "HYPERTENSION STAGE 1";
          category_description =
            "High blood pressure - lifestyle changes needed";
        } else if (
          systolic >= BP_CATEGORIES.elevated.systolic &&
          diastolic < BP_CATEGORIES.elevated.diastolic
        ) {
          category = "ELEVATED";
          category_description = "Elevated - at risk for hypertension";
        }

        const warnings = [];
        const recommendations = [];

        if (category === "HYPERTENSIVE CRISIS") {
          warnings.push(
            "CRITICAL: Seek emergency medical attention immediately"
          );
          warnings.push("Risk of stroke, heart attack, or organ damage");
        } else if (category === "HYPOTENSION") {
          warnings.push("Low blood pressure detected");
          warnings.push("May cause dizziness or fainting");
          recommendations.push("Consult healthcare provider if symptomatic");
        } else if (category.includes("HYPERTENSION")) {
          warnings.push("High blood pressure detected");
          recommendations.push("Schedule appointment with healthcare provider");
          recommendations.push("Monitor BP regularly");
        } else if (category === "ELEVATED") {
          recommendations.push("Adopt heart-healthy lifestyle changes");
          recommendations.push("Reduce sodium intake");
          recommendations.push("Increase physical activity");
        }

        if (inputs.cuff_size === "pediatric" && weight > 30) {
          warnings.push(
            "WARNING: Cuff size too small - reading may be falsely elevated"
          );
        }
        if (inputs.cuff_size === "adult_large" && weight < 50) {
          warnings.push(
            "WARNING: Cuff size too large - reading may be falsely low"
          );
        }
        if (inputs.arm_position !== "heart_level") {
          warnings.push(
            "CAUTION: Arm not at heart level - may affect accuracy"
          );
        }
        if (inputs.recent_caffeine || inputs.recent_exercise) {
          warnings.push(
            "NOTE: Recent caffeine/exercise may temporarily elevate readings"
          );
          recommendations.push(
            "Retest after 30 minutes of rest for baseline reading"
          );
        }

        if (pulse_pressure < 25) {
          warnings.push(
            "LOW pulse pressure detected - may indicate cardiac issues"
          );
        } else if (pulse_pressure > 60) {
          warnings.push(
            "HIGH pulse pressure detected - may indicate arterial stiffness"
          );
        }

        let status = "NORMAL";
        if (category === "HYPERTENSIVE CRISIS" || category === "HYPOTENSION") {
          status = "CRITICAL";
        } else if (category.includes("HYPERTENSION")) {
          status = "WARNING";
        } else if (category === "ELEVATED") {
          status = "CAUTION";
        }

        setResults({
          status,
          blood_pressure: {
            systolic_mmhg: systolic,
            diastolic_mmhg: diastolic,
            pulse_pressure_mmhg: pulse_pressure,
            mean_arterial_pressure_mmhg: mean_arterial_pressure,
          },
          classification: {
            category,
            description: category_description,
          },
          patient_data: {
            age_years: age,
            weight_kg: weight,
            activity_level: inputs.activity_level,
          },
          measurement_conditions: {
            arm_position: inputs.arm_position,
            cuff_size: inputs.cuff_size,
            recent_caffeine: inputs.recent_caffeine,
            recent_exercise: inputs.recent_exercise,
          },
          clinical_assessment: {
            warnings,
            recommendations,
          },
          timestamp: new Date(),
        });
        setMeasuring(false);
      } catch (e) {
        setResults({
          status: "ERROR",
          error_message: e.message,
          timestamp: new Date(),
        });
        setMeasuring(false);
      }
    }, 1500);
  };

  const getStatusInfo = () => {
    if (!results)
      return { text: "● Awaiting measurement", color: "text-gray-400" };
    if (results.status === "ERROR")
      return { text: "✖ ERROR - Invalid input", color: "text-red-500" };
    if (results.status === "CRITICAL")
      return {
        text: "✖ CRITICAL - Immediate attention required",
        color: "text-red-500",
      };
    if (results.status === "WARNING")
      return {
        text: "⚠ WARNING - Medical consultation recommended",
        color: "text-orange-500",
      };
    if (results.status === "CAUTION")
      return {
        text: "⚠ CAUTION - Monitor and adjust lifestyle",
        color: "text-orange-500",
      };
    return {
      text: "● NORMAL - Blood pressure within healthy range",
      color: "text-green-400",
    };
  };

  const getGaugeColor = (value, type) => {
    if (type === "systolic") {
      if (value < 90) return "#3b82f6";
      if (value < 120) return "#22c55e";
      if (value < 130) return "#eab308";
      if (value < 140) return "#f97316";
      if (value < 180) return "#dc2626";
      return "#991b1b";
    } else {
      if (value < 60) return "#3b82f6";
      if (value < 80) return "#22c55e";
      if (value < 90) return "#f97316";
      if (value < 120) return "#dc2626";
      return "#991b1b";
    }
  };

  const status = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Blood Pressure Monitor
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 lg:col-span-2 shadow-2xl border border-slate-700">
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-xl p-8 shadow-inner">
              <div className="text-center mb-6">
                <div className={`text-xl font-bold mb-2 ${status.color}`}>
                  {measuring ? "⚡ MEASURING..." : status.text}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="text-center">
                  <div className="text-cyan-400 text-sm font-semibold mb-2">
                    SYSTOLIC (mmHg)
                  </div>
                  <div className="relative w-48 h-48 mx-auto">
                    <svg viewBox="0 0 200 200" className="transform -rotate-90">
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="20"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={getGaugeColor(animatedSystolic, "systolic")}
                        strokeWidth="20"
                        strokeDasharray={`${
                          (animatedSystolic / 250) * 502
                        } 502`}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                        style={{
                          filter: "drop-shadow(0 0 8px currentColor)",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-white">
                          {animatedSystolic}
                        </div>
                        <div className="text-sm text-gray-400">mmHg</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Normal: &lt;120
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-cyan-400 text-sm font-semibold mb-2">
                    DIASTOLIC (mmHg)
                  </div>
                  <div className="relative w-48 h-48 mx-auto">
                    <svg viewBox="0 0 200 200" className="transform -rotate-90">
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="20"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke={getGaugeColor(animatedDiastolic, "diastolic")}
                        strokeWidth="20"
                        strokeDasharray={`${
                          (animatedDiastolic / 150) * 502
                        } 502`}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                        style={{
                          filter: "drop-shadow(0 0 8px currentColor)",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-white">
                          {animatedDiastolic}
                        </div>
                        <div className="text-sm text-gray-400">mmHg</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Normal: &lt;80
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 mt-6 backdrop-blur-sm border border-slate-700">
                <div className="text-cyan-400 font-bold text-sm mb-3">
                  AMERICAN HEART ASSOCIATION BLOOD PRESSURE CATEGORIES
                </div>
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2 shadow-lg shadow-green-500/50"></span>
                      Normal
                    </span>
                    <span>&lt;120 and &lt;80 mmHg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2 shadow-lg shadow-yellow-500/50"></span>
                      Elevated
                    </span>
                    <span>120-129 and &lt;80 mmHg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-orange-500 mr-2 shadow-lg shadow-orange-500/50"></span>
                      Stage 1 Hypertension
                    </span>
                    <span>130-139 or 80-89 mmHg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-red-600 mr-2 shadow-lg shadow-red-600/50"></span>
                      Stage 2 Hypertension
                    </span>
                    <span>≥140 or ≥90 mmHg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-red-900 mr-2 shadow-lg shadow-red-900/50"></span>
                      Hypertensive Crisis
                    </span>
                    <span>&gt;180 and/or &gt;120 mmHg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700">
            <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center">
              <span className="text-cyan-400 mr-2">⚙️</span> Input Parameters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2 text-sm">
                  Patient Age (years)
                </label>
                <input
                  type="number"
                  value={inputs.patient_age}
                  onChange={(e) =>
                    handleInputChange("patient_age", e.target.value)
                  }
                  className="w-full bg-slate-900 text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm">
                  Patient Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.patient_weight}
                  onChange={(e) =>
                    handleInputChange("patient_weight", e.target.value)
                  }
                  className="w-full bg-slate-900 text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm">
                  Activity Level
                </label>
                <select
                  value={inputs.activity_level}
                  onChange={(e) =>
                    handleInputChange("activity_level", e.target.value)
                  }
                  className="w-full bg-slate-900 text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700"
                >
                  <option value="resting">Resting (5+ min)</option>
                  <option value="sitting">Sitting</option>
                  <option value="standing">Standing</option>
                  <option value="post_exercise">Post-Exercise</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm">
                  Arm Position
                </label>
                <select
                  value={inputs.arm_position}
                  onChange={(e) =>
                    handleInputChange("arm_position", e.target.value)
                  }
                  className="w-full bg-slate-900 text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700"
                >
                  <option value="heart_level">At Heart Level</option>
                  <option value="above_heart">Above Heart</option>
                  <option value="below_heart">Below Heart</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2 text-sm">
                  Cuff Size
                </label>
                <select
                  value={inputs.cuff_size}
                  onChange={(e) =>
                    handleInputChange("cuff_size", e.target.value)
                  }
                  className="w-full bg-slate-900 text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700"
                >
                  <option value="pediatric">Pediatric (&lt;30kg)</option>
                  <option value="adult_small">Adult Small (50-70kg)</option>
                  <option value="adult_standard">
                    Adult Standard (70-90kg)
                  </option>
                  <option value="adult_large">Adult Large (&gt;90kg)</option>
                  <option value="thigh">Thigh Cuff</option>
                </select>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <label className="flex items-center text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.recent_caffeine}
                    onChange={(e) =>
                      handleInputChange("recent_caffeine", e.target.checked)
                    }
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-sm">Caffeine within 30 minutes</span>
                </label>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <label className="flex items-center text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.recent_exercise}
                    onChange={(e) =>
                      handleInputChange("recent_exercise", e.target.checked)
                    }
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-sm">Exercise within 30 minutes</span>
                </label>
              </div>

              <button
                onClick={calculateBloodPressure}
                disabled={measuring}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50"
              >
                {measuring ? "⚡ MEASURING..." : "⚡ MEASURE BLOOD PRESSURE"}
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700">
            <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
              <span className="text-cyan-400 mr-2">📊</span> Detailed Results
            </h2>

            <div className="bg-slate-900 rounded-lg p-6 space-y-2 text-gray-200 font-mono text-sm max-h-[600px] overflow-y-auto border border-slate-700">
              {results && !results.error_message ? (
                <>
                  <div className="text-cyan-400 font-bold mb-4">
                    CLASSIFICATION
                  </div>
                  <div>Category: {results.classification.category}</div>
                  <div>Description: {results.classification.description}</div>

                  <div className="text-cyan-400 font-bold mt-6 mb-4">
                    CALCULATED VALUES
                  </div>
                  <div>
                    Pulse Pressure: {results.blood_pressure.pulse_pressure_mmhg}{" "}
                    mmHg
                  </div>
                  <div>
                    Mean Arterial Pressure:{" "}
                    {results.blood_pressure.mean_arterial_pressure_mmhg} mmHg
                  </div>

                  <div className="text-cyan-400 font-bold mt-6 mb-4">
                    PATIENT DATA
                  </div>
                  <div>Age: {results.patient_data.age_years} years</div>
                  <div>Weight: {results.patient_data.weight_kg} kg</div>
                  <div>
                    Activity:{" "}
                    {results.patient_data.activity_level.replace("_", " ")}
                  </div>

                  <div className="text-cyan-400 font-bold mt-6 mb-4">
                    MEASUREMENT CONDITIONS
                  </div>
                  <div>
                    Arm Position:{" "}
                    {results.measurement_conditions.arm_position.replace(
                      "_",
                      " "
                    )}
                  </div>
                  <div>
                    Cuff Size:{" "}
                    {results.measurement_conditions.cuff_size.replace("_", " ")}
                  </div>
                  <div>
                    Recent Caffeine:{" "}
                    {results.measurement_conditions.recent_caffeine
                      ? "YES"
                      : "NO"}
                  </div>
                  <div>
                    Recent Exercise:{" "}
                    {results.measurement_conditions.recent_exercise
                      ? "YES"
                      : "NO"}
                  </div>

                  {results.clinical_assessment.warnings.length > 0 && (
                    <>
                      <div className="text-orange-500 font-bold mt-6 mb-4">
                        WARNINGS
                      </div>
                      {results.clinical_assessment.warnings.map((w, i) => (
                        <div key={i} className="text-orange-400">
                          ⚠ {w}
                        </div>
                      ))}
                    </>
                  )}

                  {results.clinical_assessment.recommendations.length > 0 && (
                    <>
                      <div className="text-cyan-400 font-bold mt-6 mb-4">
                        RECOMMENDATIONS
                      </div>
                      {results.clinical_assessment.recommendations.map(
                        (r, i) => (
                          <div key={i} className="text-gray-300">
                            • {r}
                          </div>
                        )
                      )}
                    </>
                  )}

                  <div className="text-gray-500 text-xs mt-6">
                    Measured: {results.timestamp.toLocaleString()}
                  </div>
                </>
              ) : results && results.error_message ? (
                <div className="text-red-400">
                  <div className="text-red-500 font-bold mb-4">ERROR</div>
                  <div>✖ {results.error_message}</div>
                  <div className="mt-4 text-gray-400">
                    Timestamp: {results.timestamp.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">
                  Enter parameters and click Measure to see results
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodPressureMonitor;
